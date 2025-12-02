import json
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

import requests


class PartService:
    # In-memory cache to store part_info responses
    # Format: {session_id: {"data": part_info, "expires_at": datetime}}
    _cache: Dict[str, Dict[str, Any]] = {}
    _cache_ttl_minutes = 30

    @staticmethod
    def get_part_info(license_plate: str, part_name: str):
        try:
            part_info = requests.post(
                "https://n8n.bullnice.tech/webhook/afa656ab-e7f1-45fc-9a27-9d7376e50b30",
                json={
                    "license_plate": license_plate,
                    "part_name": part_name,
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
    def get_category_links(part_info: Any, category: str) -> Optional[list]:
        """Extract links for a specific category from part_info"""
        if not isinstance(part_info, list):
            return None

        for item in part_info:
            if isinstance(item, dict) and category in item:
                links_str = item[category]
                # Parse the JSON string if it's a string
                if isinstance(links_str, str):
                    try:
                        links = json.loads(links_str)
                        return links if isinstance(links, list) else [links]
                    except json.JSONDecodeError:
                        return [links_str]
                elif isinstance(links_str, list):
                    return links_str
                else:
                    return [str(links_str)]

        return None
