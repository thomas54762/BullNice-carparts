"""
Custom JWT Authentication that reads tokens from cookies.
"""

from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

User = get_user_model()


class CookieJWTAuthentication(JWTAuthentication):
    """
    JWT Authentication that reads tokens from cookies as a fallback.
    First tries Authorization header, then falls back to cookies.
    """

    def authenticate(self, request):
        # First try the standard header-based authentication
        header = self.get_header(request)
        if header is not None:
            raw_token = self.get_raw_token(header)
            if raw_token is not None:
                validated_token = self.get_validated_token(raw_token)
                user = self.get_user(validated_token)
                return (user, validated_token)

        # If no header token, try to get token from cookies
        raw_token = request.COOKIES.get("access")
        if raw_token is None:
            return None

        try:
            validated_token = self.get_validated_token(raw_token)
        except TokenError as e:
            raise InvalidToken(
                {
                    "detail": _("Given token not valid for any token type"),
                    "code": "token_not_valid",
                    "messages": [
                        {
                            "token_class": "AccessToken",
                            "token_type": "access",
                            "message": e.args[0],
                        }
                    ],
                }
            )

        user = self.get_user(validated_token)
        return (user, validated_token)
