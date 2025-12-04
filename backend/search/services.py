from typing import Any, Dict

import requests


class PartService:
    """
    Thin wrapper around the n8n webhook that triggers the async processing.

    The webhook itself is responsible for fetching data and saving it into
    the SearchResult model. We only care that the request was accepted.
    """

    @staticmethod
    def get_part_info(
        license_plate: str,
        part_name: str,
        car_type: str,
        car_model_type: str,
        car_model: str,
    ) -> Dict[str, Any]:
        response = requests.post(
            "https://n8n.bullnice.tech/webhook/afa656ab-e7f1-45fc-9a27-9d7376e50b30",
            json={
                "license_plate": license_plate,
                "part_name": part_name,
                "car_type": car_type,
                "car_model_type": car_model_type,
                "car_model": car_model,
            },
            timeout=30,
        )
        return response.json()
