import json
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import requests


class PartService:
    # In-memory cache to store part_info responses
    # Format: {session_id: {"data": part_info, "expires_at": datetime}}
    _cache: Dict[str, Dict[str, Any]] = {}
    _cache_ttl_minutes = 30

    @staticmethod
    def get_part_info(
        license_plate: str,
        part_name: str,
        car_type: str,
        car_model_type: str,
        car_model: str,
    ):
        try:
            part_info = requests.post(
                "https://n8n.bullnice.tech/webhook/afa656ab-e7f1-45fc-9a27-9d7376e50b30",
                json={
                    "license_plate": license_plate,
                    "part_name": part_name,
                    "car_type": car_type,
                    "car_model_type": car_model_type,
                    "car_model": car_model,
                },
            )
            return part_info.json()
        except Exception:
            return None

    @staticmethod
    def store_part_info(part_info: Any) -> str:
        """Store part_info in cache and return a session ID"""
        session_id = str(uuid.uuid4())
        expires_at = datetime.now() + timedelta(minutes=PartService._cache_ttl_minutes)
        PartService._cache[session_id] = {
            "data": part_info,
            "expires_at": expires_at,
        }
        return session_id

    @staticmethod
    def get_stored_part_info(session_id: str) -> Optional[Any]:
        """Retrieve stored part_info by session ID"""
        if session_id not in PartService._cache:
            return None

        cache_entry = PartService._cache[session_id]
        expires_at = cache_entry["expires_at"]

        # Check if expired
        if datetime.now() > expires_at:
            del PartService._cache[session_id]
            return None

        return cache_entry["data"]

    @staticmethod
    def get_category_links(part_info: Any, category: str) -> Optional[List[str]]:
        """Extract links for a specific category from normalized part_info"""
        if not isinstance(part_info, dict):
            return None

        links = part_info.get(category)
        if not links:
            return None

        return PartService._ensure_list(links)

    @staticmethod
    def normalize_part_info_response(part_info: Any) -> Dict[str, List[str]]:
        """
        Normalize the webhook response into a dictionary of
        {category: [links]} pairs.
        """
        normalized: Dict[str, List[str]] = {}

        if isinstance(part_info, dict):
            for category, links in part_info.items():
                normalized[category] = PartService._ensure_list(links)
            return normalized

        if isinstance(part_info, list):
            for item in part_info:
                if not isinstance(item, dict):
                    continue

                items = item.get("items")
                if isinstance(items, dict):
                    for category, links in items.items():
                        normalized[category] = PartService._ensure_list(links)
                    continue

                for category, links in item.items():
                    normalized[category] = PartService._ensure_list(links)

        return normalized

    @staticmethod
    def _ensure_list(value: Any) -> List[str]:
        """Convert webhook link payloads into a list of urls."""
        if value is None:
            return []

        if isinstance(value, list):
            return value

        if isinstance(value, str):
            try:
                parsed = json.loads(value)
                if isinstance(parsed, list):
                    return parsed
            except json.JSONDecodeError:
                return [value]

        return [str(value)]
