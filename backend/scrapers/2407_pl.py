import asyncio

from playwright.async_api import async_playwright


async def scrape_2407(query: str):
    async with async_playwright() as p:
        # browser = await p.chromium.launch(headless=False)
        browser = await p.chromium.launch(
            headless=False,
            proxy={
                "server": "http://brd.superproxy.io:33335",
                "username": "brd-customer-hl_970897e8-zone-bullnice_carparts",
                "password": "ah0f9vilas3x",
            },
            args=[
                "--ignore-certificate-errors",
                "--disable-web-security",
            ],
        )
        context = await browser.new_context(
            permissions=[
                "clipboard-read",
                "clipboard-write",
                "geolocation",
                "notifications",
                "camera",
                "microphone",
            ],
        )
        page = await context.new_page()
        # await page.goto("https://2407.pl/")
        await page.goto("https://2407.pl/", wait_until="commit", timeout=60000)

        # Handle cookie consent popup if it appears
        try:
            cookie_button = page.locator("button:has-text('Ok, zgadzam się')")
            await cookie_button.wait_for(state="visible", timeout=5000)
            await cookie_button.click()
            await page.wait_for_timeout(1000)
        except Exception:
            pass

        await page.click("button[aria-label='search']:visible")
        await page.fill("input[aria-label='multiSearch']", query)

        # Wait for the dropdown to appear
        await page.wait_for_selector(
            "div.MultiSearchResultsstyle__MultiSearchResultsWrapper-sc-obi7cd-0",
            state="visible",
            timeout=5000,
        )

        await page.wait_for_timeout(500)

        first_result = page.locator(
            "div.MultiSearchResultsstyle__MultiSearchResultsWrapper-sc-obi7cd-0 a"
        ).first

        # Wait for navigation after clicking (use wait_for_url with a pattern)
        async with page.expect_navigation(timeout=10000):
            await first_result.click()

        await page.wait_for_load_state("load")

        # Wait for products to appear
        await page.wait_for_selector(
            "div.Liststyle__CatalogueList-sc-8cmrw6-0",
            state="visible",
            timeout=10000,
        )

        # Wait for at least one product to appear
        first_product = page.locator(
            "div.ListItemstyle__CatalogueListItem-sc-1gf1g4g-6"
        ).first
        await first_product.wait_for(state="visible", timeout=5000)

        # Extract product information
        products = []
        product_count = await page.locator(
            "div.ListItemstyle__CatalogueListItem-sc-1gf1g4g-6"
        ).count()

        # Limit to first 10 products
        max_products = min(10, product_count)

        for i in range(max_products):
            product_item = page.locator(
                "div.ListItemstyle__CatalogueListItem-sc-1gf1g4g-6"
            ).nth(i)

            try:
                # Extract title - use the title attribute from the link which has the full product name
                title_element = product_item.locator(
                    "a.ListItemTitlestyle__CatalogueListItemTitleLink-sc-904etm-1"
                ).first
                if await title_element.count() > 0:
                    title = await title_element.get_attribute("title")
                    if not title:
                        title = await title_element.inner_text()
                    title = " ".join(title.split()) if title else "N/A"
                else:
                    title = "N/A"

                # Extract URL
                url_element = product_item.locator(
                    "a.ListItemTitlestyle__CatalogueListItemTitleLink-sc-904etm-1"
                ).first
                if await url_element.count() > 0:
                    relative_url = await url_element.get_attribute("href") or "N/A"
                    if relative_url != "N/A":
                        # Make absolute URL if it's relative
                        url = (
                            f"https://2407.pl{relative_url}"
                            if relative_url.startswith("/")
                            else relative_url
                        )
                    else:
                        url = "N/A"
                else:
                    url = "N/A"

                image_element = product_item.locator("img").first
                if await image_element.count() > 0:
                    image_url = await image_element.get_attribute("src") or "N/A"
                    if image_url != "N/A" and not image_url.startswith("http"):
                        image_url = f"https://2407.pl{image_url}"
                else:
                    image_url = "N/A"

                price_element = product_item.locator(
                    "div.ListItemPricestyle__CatalogueListItemPriceValue-sc-qbj488-3"
                ).first
                price_text = (
                    await price_element.inner_text()
                    if await price_element.count() > 0
                    else "N/A"
                )

                price = " ".join(price_text.split()) if price_text != "N/A" else "N/A"

                products.append(
                    {
                        "title": title,
                        "image": image_url,
                        "price": price,
                        "url": url,
                    }
                )
            except Exception as e:
                print(f"Error extracting product {i + 1}: {e}")
                continue

        print(f"\nFound {len(products)} products:\n")
        for idx, product in enumerate(products, 1):
            print(f"Product {idx}:")
            print(f"  Title: {product['title']}")
            print(f"  Price: {product['price']}")
            print(f"  Image: {product['image']}")
            print(f"  URL: {product['url']}")
            print()

        await browser.close()


if __name__ == "__main__":
    asyncio.run(scrape_2407("breaks"))
