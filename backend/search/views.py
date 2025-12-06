from django.db.models import Count, Max
from rest_framework import status
from rest_framework.response import Response
from rest_framework.throttling import SimpleRateThrottle
from rest_framework.views import APIView

from search.services import PartService

from .models import SearchResult


class IPRateThrottle(SimpleRateThrottle):
    """Custom throttle based on IP address - works for both authenticated and anonymous users"""

    rate = "10/minute"  # Default rate

    def get_cache_key(self, request, view):
        """
        Should return a unique cache key which can be used to throttle requests.
        """
        ident = self.get_ident(request)
        return f"throttle_ip_{ident}"

    def get_ident(self, request):
        """
        Identify the machine making the request by IP address.
        """
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0]
        else:
            ip = request.META.get("REMOTE_ADDR")
        return ip


class PartsSearchThrottle(IPRateThrottle):
    """Custom throttle for parts search endpoint - stricter rate limiting to prevent webhook abuse"""

    rate = "5/minute"  # Limit to 5 requests per minute per IP


class PartsSearchView(APIView):
    throttle_classes = [PartsSearchThrottle]

    def post(self, request):
        license_plate = request.data.get("license_plate")
        part_name = request.data.get("part_name")
        car_type = request.data.get("car_type")
        car_model_type = request.data.get("car_model_type")
        car_model = request.data.get("car_model")
        if (
            not license_plate
            or not part_name
            or not car_type
            or not car_model_type
            or not car_model
        ):
            return Response(
                {
                    "error": "Plate, part name, car type, car model type and car model are required"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            # Trigger async webhook; ignore payload structure and treat it as confirmation only
            PartService.get_part_info(
                license_plate, part_name, car_type, car_model_type, car_model
            )

            return Response(
                {
                    "message": "Request received. We're processing your request and results will be available soon on the Results page."
                },
                status=status.HTTP_202_ACCEPTED,
            )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class SearchResultListView(APIView):
    """
    Returns a list of unique search_result_id groups with basic aggregation data.

    Response example:
    [
        {
            "search_result_id": 1,
            "search_keyword": "Brake Pads",
            "count": 5,
            "latest_created_at": "2025-01-01T12:00:00Z"
        },
        ...
    ]
    """

    def get(self, request):
        groups = (
            SearchResult.objects.values("search_result_id")
            .annotate(
                search_keyword=Max(
                    "search_keyword"
                ),  # All results in a group have same keyword
                count=Count("id"),
                latest_created_at=Max("created_at"),
            )
            .order_by("-latest_created_at")
        )
        return Response(list(groups), status=status.HTTP_200_OK)


class SearchResultDetailView(APIView):
    """
    Returns all website-level results for a given search_result_id.

    Response example:
    {
        "search_keyword": "Brake Pads",
        "items": [
            {
                "website_search_id": 1,
                "title": "...",
                "price": "0.000",
                "url": "https://..."
            },
            ...
        ]
    }
    """

    def get(self, request, search_result_id: int):
        results = SearchResult.objects.filter(
            search_result_id=search_result_id
        ).order_by("website_search_id")

        if not results.exists():
            return Response(
                {"error": "No results found for this search_result_id"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Get search_keyword from first result (all should have same keyword)
        search_keyword = results.first().search_keyword

        items = results.values("website_search_id", "title", "price", "url")

        return Response(
            {
                "search_keyword": search_keyword,
                "items": list(items),
            },
            status=status.HTTP_200_OK,
        )
