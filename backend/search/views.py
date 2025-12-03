from rest_framework import status
from rest_framework.response import Response
from rest_framework.throttling import SimpleRateThrottle
from rest_framework.views import APIView

from search.services import PartService


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
            part_info = PartService.get_part_info(
                license_plate, part_name, car_type, car_model_type, car_model
            )
            normalized_part_info = PartService.normalize_part_info_response(part_info)

            if not normalized_part_info:
                return Response(
                    {"error": "No part information found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            categories = list(normalized_part_info.keys())

            if len(categories) > 1:
                session_id = PartService.store_part_info(normalized_part_info)
                return Response(
                    {
                        "message": "Please select the appropriate category for the given part",
                        "categories": categories,
                        "flag": "select_category",
                        "sessionId": session_id,
                    },
                    status=status.HTTP_200_OK,
                )

            return Response(
                {
                    "message": "Part information retrieved successfully",
                    "data": normalized_part_info,
                    "flag": "success",
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class CategoryDataView(APIView):
    throttle_classes = [
        IPRateThrottle
    ]  # Less strict throttling since it doesn't call webhook

    def post(self, request):
        session_id = request.data.get("session_id")
        category = request.data.get("category")

        if not session_id or not category:
            return Response(
                {"error": "Session ID and category are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Retrieve stored part_info from cache
            part_info = PartService.get_stored_part_info(session_id)

            if part_info is None:
                return Response(
                    {"error": "Session expired or invalid session ID"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Extract links for the specified category
            links = PartService.get_category_links(part_info, category)

            if links is None:
                return Response(
                    {"error": f"Category '{category}' not found in stored data"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            return Response(
                {
                    "message": "Category data retrieved successfully",
                    "category": category,
                    "links": links,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
