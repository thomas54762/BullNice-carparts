import asyncio
import base64
import json
import re
from datetime import datetime
from difflib import get_close_matches

from playwright.async_api import async_playwright


def slugify(name: str):
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def soft_match(user_input: str, brand_list: list[str], threshold=0.6):
    matches = get_close_matches(user_input, brand_list, n=1, cutoff=threshold)
    return matches[0] if matches else None


def decode_encoded_url(encoded_data: str) -> str:
    """Decode base64 encoded URL from data-field attribute."""
    try:
        decoded_bytes = base64.b64decode(encoded_data)
        decoded_url = decoded_bytes.decode("utf-8")
        return decoded_url
    except Exception as e:
        print(f"Error decoding URL: {e}")
        return None


def extract_year_range(year_text: str) -> tuple[int, int]:
    """Extract start and end year from text like '2016 - Now' or '2009 - 2017'."""
    try:
        # Handle different formats: "2016 - Now", "2009 - 2017", "1967 - 1977"
        year_text = year_text.strip()
        parts = year_text.split("-")
        if len(parts) == 2:
            start_year = int(parts[0].strip())
            end_part = parts[1].strip()
            if end_part.lower() == "now":
                end_year = datetime.now().year
            else:
                end_year = int(end_part)
            return (start_year, end_year)
    except Exception as e:
        print(f"Error parsing year range '{year_text}': {e}")
    return (None, None)


def check_year_in_range(year: int, start_year: int, end_year: int) -> bool:
    """Check if a given year falls within a range."""
    if year is None or start_year is None or end_year is None:
        return False
    return start_year <= year <= end_year


def normalize_model_name(model: str, brand: str = None) -> str:
    """Normalize model name for better matching.

    Args:
        model: The model name to normalize
        brand: Optional brand name to remove from the beginning of model name
    """
    model = model.lower()

    # Remove brand prefix if provided (e.g., "BMW 5" -> "5" when brand is "BMW")
    if brand:
        brand_pattern = rf"^{re.escape(brand.lower())}\s+"
        model = re.sub(brand_pattern, "", model)

    # Remove special characters and extra spaces
    model = re.sub(r"[^a-z0-9\s]", " ", model)
    model = " ".join(model.split())  # normalize spaces
    return model.strip()


async def search_part_autocomplete(page, part_name: str) -> bool:
    """Search for a part using the autocomplete input field.

    Args:
        page: Playwright page object
        part_name: The name of the part to search for

    Returns:
        True if search was successful, False otherwise
    """
    try:
        print(f"Searching for part: {part_name}")

        # Find and type into the search input
        search_input = await page.wait_for_selector(
            "input#awesomplete.input__field", timeout=5000
        )

        # Clear any existing text
        await search_input.fill("")
        await page.wait_for_timeout(300)

        # Type gradually and watch for suggestions
        suggestions_found = False
        for i in range(1, len(part_name) + 1):
            partial_text = part_name[:i]
            await search_input.fill(partial_text)
            await page.wait_for_timeout(200)

            # Check if suggestions appeared - target the awesomplete dropdown specifically
            suggestions_list = await page.query_selector(
                "div.awesomplete > ul:not([hidden])"
            )
            if suggestions_list:
                suggestions = await suggestions_list.query_selector_all("li")
                if suggestions and len(suggestions) > 0:
                    # Suggestions found!
                    print(f"Found suggestions after typing: '{partial_text}'")
                    suggestions_found = True

                    # Get all suggestion texts
                    suggestion_texts = []
                    for suggestion in suggestions:
                        # Get text content, handling HTML markup
                        text = await suggestion.evaluate("el => el.textContent")
                        if text:
                            clean_text = text.strip()
                            if clean_text:  # Only add non-empty suggestions
                                suggestion_texts.append(clean_text)

                    print(f"Available suggestions: {suggestion_texts}")

                    # Try to find the best match
                    normalized_part = part_name.lower()
                    best_match = soft_match(
                        normalized_part,
                        [s.lower() for s in suggestion_texts],
                        threshold=0.4,
                    )

                    if best_match:
                        match_index = [s.lower() for s in suggestion_texts].index(
                            best_match
                        )
                        print(f"Selecting best match: {suggestion_texts[match_index]}")

                        # Navigate to the right suggestion with arrow keys
                        for _ in range(match_index + 1):
                            await search_input.press("ArrowDown")
                            await page.wait_for_timeout(100)
                    else:
                        # Select first suggestion
                        print(f"Using first suggestion: {suggestion_texts[0]}")
                        await search_input.press("ArrowDown")
                        await page.wait_for_timeout(100)

                    # Press Enter to select
                    await search_input.press("Enter")
                    await page.wait_for_timeout(2000)

                    # Wait for products to load
                    try:
                        await page.wait_for_selector(
                            "li.productList__item", timeout=10000
                        )
                        print("Products loaded successfully")
                    except Exception:
                        print("Results page loaded (may have no products)")

                    return True

        # If no suggestions found after typing everything
        if not suggestions_found:
            print(
                f"No suggestions found for '{part_name}' - product may not be available"
            )
            return False

        return True

    except Exception as e:
        print(f"Error during part search: {e}")
        return False


async def extract_available_models(page):
    """Extract all available models from the simple list (both links and encoded spans)."""
    models = []

    # Find all model headlines
    model_headlines = await page.query_selector_all(
        "div.findingParts__modelGroups__model_headline"
    )

    for headline in model_headlines:
        # Check for regular links first
        link = await headline.query_selector("a.link")
        if link:
            model_name = await link.inner_text()
            href = await link.get_attribute("href")
            models.append(
                {
                    "name": model_name.strip(),
                    "element": link,
                    "type": "link",
                    "href": href,
                }
            )
        else:
            # Check for encoded spans
            encoded_span = await headline.query_selector("span.L_encoded")
            if encoded_span:
                model_name = await encoded_span.inner_text()
                encoded_data = await encoded_span.get_attribute("data-field")
                models.append(
                    {
                        "name": model_name.strip(),
                        "element": encoded_span,
                        "type": "encoded",
                        "data_field": encoded_data,
                    }
                )

    return models


async def click_model_element(page, model_info: dict) -> bool:
    """Click on a model element (handles both regular links and encoded spans)."""
    try:
        if model_info["type"] == "link":
            # Regular link - just click it
            await model_info["element"].click()
            return True
        elif model_info["type"] == "encoded":
            # Try clicking the span first
            try:
                await model_info["element"].click()
                return True
            except Exception as e:
                print(f"Clicking span failed, trying to decode and navigate: {e}")
                # If clicking fails, decode and navigate
                decoded_url = decode_encoded_url(model_info["data_field"])
                if decoded_url:
                    await page.goto(decoded_url)
                    return True
        return False
    except Exception as e:
        print(f"Error clicking model element: {e}")
        return False


async def extract_detailed_models(page):
    """Extract models with year ranges from the expanded 'show all' list."""
    models = []

    # Find all detailed model entries
    model_entries = await page.query_selector_all(
        "div.findingParts__modelGroups__model"
    )

    for entry in model_entries:
        # Extract year range
        year_box = await entry.query_selector(
            "div.box--m-w50p-t-w25p-m-pr-xxsmall-t-pr-none"
        )
        year_text = await year_box.inner_text() if year_box else ""
        year_text = year_text.strip()

        # Extract model name and link/encoded element
        model_box = await entry.query_selector("div.box--m-w50p-t-w75p")
        if model_box:
            # Check for regular link
            link = await model_box.query_selector("a")
            if link:
                model_name = await link.inner_text()
                href = await link.get_attribute("href")
                models.append(
                    {
                        "name": model_name.strip(),
                        "year_text": year_text,
                        "element": link,
                        "type": "link",
                        "href": href,
                    }
                )
            else:
                # Check for encoded span
                encoded_span = await model_box.query_selector(
                    "span.L_encoded, span.modelEncoded"
                )
                if encoded_span:
                    model_name = await encoded_span.inner_text()
                    encoded_data = await encoded_span.get_attribute("data-field")
                    models.append(
                        {
                            "name": model_name.strip(),
                            "year_text": year_text,
                            "element": encoded_span,
                            "type": "encoded",
                            "data_field": encoded_data,
                        }
                    )

    return models


async def extract_product_details(product_item) -> dict:
    """Extract details from a single product item.

    Args:
        product_item: Playwright element handle for a product list item

    Returns:
        Dictionary with product details
    """
    try:
        product = {}

        # Extract title and URL
        title_div = await product_item.query_selector("div.productList__title a")
        if title_div:
            product["title"] = (await title_div.inner_text()).strip()
            href = await title_div.get_attribute("href")
            product["url"] = f"https://www.autoparts-24.com{href}" if href else None

        # Extract image URL
        img = await product_item.query_selector("img.visual")
        if img:
            product["image_url"] = await img.get_attribute("src")
        else:
            product["image_url"] = None

        # If URL not found in title link, try to decode from itemEncoded span
        if not product.get("url"):
            encoded_span = await product_item.query_selector("span.itemEncoded")
            if encoded_span:
                encoded_data = await encoded_span.get_attribute("data-field")
                if encoded_data:
                    product["url"] = decode_encoded_url(encoded_data)

        # Extract price
        price_span = await product_item.query_selector("span[id^='price-']")
        if price_span:
            price_amount = await price_span.get_attribute("data-price")
            currency_span = await product_item.query_selector(
                "span.productList__price span[itemprop='priceCurrency']"
            )
            currency = await currency_span.inner_text() if currency_span else "EUR"
            product["price"] = {
                "amount": float(price_amount) if price_amount else None,
                "currency": currency.strip(),
            }
        else:
            product["price"] = {"amount": None, "currency": "EUR"}

        # Extract delivery time
        delivery_span = await product_item.query_selector("span[id^='time-']")
        if delivery_span:
            delivery_days = await delivery_span.inner_text()
            # Find the parent to get the full delivery text
            delivery_parent = await product_item.query_selector(
                "span.productList__delivery"
            )
            if delivery_parent:
                full_delivery_text = await delivery_parent.inner_text()
                product["delivery_time"] = full_delivery_text.strip()
            else:
                product["delivery_time"] = f"{delivery_days.strip()} workdays"
        else:
            product["delivery_time"] = None

        # Extract all specs from partInfo and carInfo sections
        specs = {}

        # Extract from all productInfo lists
        info_lists = await product_item.query_selector_all("ul.productInfo")
        for info_list in info_lists:
            items = await info_list.query_selector_all("li.productInfo__item")
            for item in items:
                item_text = await item.inner_text()
                # Parse the format "Key: Value"
                if ":" in item_text:
                    parts = item_text.split(":", 1)
                    key = parts[0].strip()
                    value = parts[1].strip()
                    specs[key] = value

        product["specs"] = specs

        return product

    except Exception as e:
        print(f"Error extracting product details: {e}")
        return None


async def extract_all_products(page) -> list:
    """Extract all products from the current page.

    Args:
        page: Playwright page object

    Returns:
        List of product dictionaries
    """
    products = []

    try:
        # Wait for product list to load
        await page.wait_for_selector("li.productList__item", timeout=10000)

        # Get all product items
        product_items = await page.query_selector_all("li.productList__item")
        print(f"Found {len(product_items)} products on current page")

        for item in product_items:
            product = await extract_product_details(item)
            if product:
                products.append(product)

    except Exception as e:
        print(f"Error extracting products: {e}")

    return products


async def handle_pagination(page, max_pages: int = 1) -> list:
    """Handle pagination and extract products from multiple pages.

    Args:
        page: Playwright page object
        max_pages: Maximum number of pages to scrape (default: 1)

    Returns:
        List of all products from all pages
    """
    all_products = []
    current_page = 1

    while current_page <= max_pages:
        print(f"Extracting products from page {current_page}")

        # Extract products from current page
        products = await extract_all_products(page)
        all_products.extend(products)

        if current_page >= max_pages:
            break

        # Try to find and click "next page" button
        try:
            # Look for pagination links - common patterns
            next_button = await page.query_selector(
                "a.pagination__next, a[rel='next'], a:has-text('Next')"
            )

            if next_button:
                print(f"Navigating to page {current_page + 1}")
                await next_button.click()
                await page.wait_for_load_state("networkidle", timeout=10000)
                await page.wait_for_timeout(1000)
                current_page += 1
            else:
                print("No more pages found")
                break

        except Exception as e:
            print(f"Error navigating to next page: {e}")
            break

    return all_products


async def scrape_autoparts_24(
    part_name: str,
    brand: str,
    model: str = None,
    year: int = None,
    max_pages: int = 1,
) -> dict:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context()
        page = await context.new_page()
        await page.goto("https://autoparts-24.com/")

        await page.wait_for_selector("a.SUBCATEGORY_ITEM")

        # Click on show more manufacturers button
        show_more_button = page.get_by_text("Show more manufacturers")
        await show_more_button.click()

        # Wait for more products to load - wait for network to be idle or for more categories to appear
        await page.wait_for_load_state("networkidle", timeout=20000)

        # Wait a bit more to ensure all products are rendered
        await page.wait_for_timeout(1000)

        manufacturers = await page.query_selector_all("div.manufacturer-grid-item")
        found_brands = []
        for m in manufacturers:
            brand_info = await m.query_selector("div.categorySearch__brandInfo")
            name_el = await brand_info.query_selector("b")
            name = await name_el.inner_text() if name_el else None
            found_brands.append(name.strip() if name else None)

        print(f"Found {len(found_brands)} brands")
        machted_brand = soft_match(brand, found_brands)
        if machted_brand:
            print(f"Matched brand: {machted_brand}")
            await page.click(f"a[href*='/{slugify(machted_brand)}/']")
            await page.wait_for_timeout(1000)

            await page.wait_for_load_state("networkidle", timeout=10000)

            if model:
                print(f"Looking for model: {model}")
                model_selected = False

                # Step 1: Try to find model in simple list first
                available_models = await extract_available_models(page)
                print(f"Found {len(available_models)} models in simple list")

                # Normalize the user input model name
                normalized_input = normalize_model_name(model, machted_brand)

                # Create a list of model names for fuzzy matching
                model_names = [m["name"] for m in available_models]
                normalized_model_names = [
                    normalize_model_name(name, machted_brand) for name in model_names
                ]

                # Try fuzzy matching
                matched_name = soft_match(
                    normalized_input, normalized_model_names, threshold=0.6
                )

                if matched_name:
                    # Find the original model info
                    matched_index = normalized_model_names.index(matched_name)
                    matched_model = available_models[matched_index]
                    print(f"Found match in simple list: {matched_model['name']}")

                    # Try to click it
                    if await click_model_element(page, matched_model):
                        print(f"Successfully clicked model: {matched_model['name']}")
                        await page.wait_for_timeout(1000)
                        await page.wait_for_load_state("networkidle", timeout=10000)
                        model_selected = True

                # Step 2: If not found in simple list or if year is provided, try detailed list
                if not model_selected and year:
                    print(
                        f"Model not selected yet, trying detailed list with year {year}"
                    )

                    # Click "show all" button
                    try:
                        show_all_button = page.get_by_text("show all", exact=False)
                        await show_all_button.click()
                        await page.wait_for_timeout(1000)
                        await page.wait_for_load_state("networkidle", timeout=10000)

                        # Extract detailed models with year ranges
                        detailed_models = await extract_detailed_models(page)
                        print(f"Found {len(detailed_models)} models in detailed list")

                        # Filter by year and try to match
                        matching_models = []
                        for detailed_model in detailed_models:
                            # Parse year range
                            start_year, end_year = extract_year_range(
                                detailed_model["year_text"]
                            )

                            # Check if year matches
                            if check_year_in_range(year, start_year, end_year):
                                # Check if model name matches
                                normalized_detailed = normalize_model_name(
                                    detailed_model["name"], machted_brand
                                )
                                if (
                                    normalized_input in normalized_detailed
                                    or normalized_detailed in normalized_input
                                ):
                                    matching_models.append(detailed_model)

                        if matching_models:
                            # Use the first matching model
                            best_match = matching_models[0]
                            print(
                                f"Found match with year: {best_match['name']} ({best_match['year_text']})"
                            )

                            if await click_model_element(page, best_match):
                                print(
                                    f"Successfully clicked model: {best_match['name']}"
                                )
                                await page.wait_for_timeout(1000)
                                await page.wait_for_load_state(
                                    "networkidle", timeout=10000
                                )
                                model_selected = True
                        else:
                            print(f"No model found matching '{model}' with year {year}")

                    except Exception as e:
                        print(f"Error with show all button or detailed selection: {e}")

                if not model_selected:
                    print(f"Warning: Could not select model '{model}'")
            else:
                print("No model specified, skipping model selection")

            # Search for the part
            print("\n" + "=" * 50)
            print("PART SEARCH")
            print("=" * 50)

            search_success = await search_part_autocomplete(page, part_name)

            if not search_success:
                print("Failed to search for part")
                await browser.close()
                return {
                    "brand": machted_brand,
                    "model": model,
                    "part_name": part_name,
                    "total_products": 0,
                    "products": [],
                    "error": "Search failed",
                }

            # Extract products from results
            print("\n" + "=" * 50)
            print("PRODUCT EXTRACTION")
            print("=" * 50)

            all_products = await handle_pagination(page, max_pages)

            # Prepare the result
            result = {
                "brand": machted_brand,
                "model": model,
                "year": year,
                "part_name": part_name,
                "total_products": len(all_products),
                "products": all_products,
            }

            print(f"\n✓ Successfully extracted {len(all_products)} products")

            await browser.close()
            return result

        else:
            print("No brand found, skipping...")
            await browser.close()
            return {
                "brand": brand,
                "model": model,
                "part_name": part_name,
                "total_products": 0,
                "products": [],
                "error": "Brand not found",
            }


if __name__ == "__main__":
    # Test scenarios:

    # 1. BMW 5 G30 with brake - model selection working
    result = asyncio.run(
        scrape_autoparts_24("brake", "BMW", "5 G30", year=2018, max_pages=1)
    )

    # 2. Test with dashboard
    # result = asyncio.run(scrape_autoparts_24("dashboard", "BMW", "5", max_pages=1))

    # 3. Regular model
    # result = asyncio.run(scrape_autoparts_24("brake", "BMW", "3", max_pages=1))

    print("\n" + "=" * 50)
    print("FINAL RESULTS")
    print("=" * 50)
    print(json.dumps(result, indent=2, ensure_ascii=False))
