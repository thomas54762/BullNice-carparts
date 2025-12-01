from django.contrib.auth import get_user_model
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .serializers import (
    CustomTokenObtainPairSerializer,
    UserRegistrationSerializer,
    UserSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """View for user registration."""

    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="Register a new user",
        description="Create a new user account using email and password. Returns JWT tokens upon successful registration.",
        request=UserRegistrationSerializer,
        responses={
            201: OpenApiResponse(
                response=UserSerializer,
                description="User successfully registered. Returns user data and JWT tokens.",
            ),
            400: OpenApiResponse(description="Invalid input data."),
        },
        tags=["Authentication"],
    )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate JWT tokens for the newly registered user
        refresh = RefreshToken.for_user(user)
        response = Response(
            {
                "user": UserSerializer(user).data,
                "details": "User registered successfully.",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )
        response.set_cookie(
            key="access",
            value=str(refresh.access_token),
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite="Lax",
            max_age=86400,  # 1 day
        )
        response.set_cookie(
            key="refresh",
            value=str(refresh),
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite="Lax",
            max_age=604800,  # 7 days
        )
        return response


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom token obtain view that uses email instead of username."""

    serializer_class = CustomTokenObtainPairSerializer

    @extend_schema(
        summary="Login with email and password",
        description="Authenticate a user with email and password. Returns JWT access and refresh tokens.",
        request=CustomTokenObtainPairSerializer,
        responses={
            200: OpenApiResponse(
                description="Successfully authenticated. Returns access and refresh tokens.",
                examples={
                    "application/json": {
                        "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
                        "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
                    }
                },
            ),
            401: OpenApiResponse(description="Invalid credentials."),
        },
        tags=["Authentication"],
    )
    def post(self, request, *args, **kwargs):
        # we need to set the cookies for the access and refresh tokens
        response = super().post(request, *args, **kwargs)
        response.set_cookie(
            key="access",
            value=response.data["access"],
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite="Lax",
            max_age=86400,  # 1 day
        )
        response.set_cookie(
            key="refresh",
            value=response.data["refresh"],
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite="Lax",
            max_age=604800,  # 7 days
        )
        return response


class CustomTokenRefreshView(TokenRefreshView):
    """Custom token refresh view that reads refresh token from cookies."""

    @extend_schema(
        summary="Refresh access token",
        description="Refresh the access token using the refresh token from cookies.",
        responses={
            200: OpenApiResponse(
                description="Successfully refreshed. Returns new access token.",
                examples={
                    "application/json": {
                        "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
                    }
                },
            ),
            401: OpenApiResponse(description="Invalid or expired refresh token."),
        },
        tags=["Authentication"],
    )
    def post(self, request, *args, **kwargs):
        # Try to get refresh token from cookies first, then from request body
        refresh_token = request.COOKIES.get("refresh") or request.data.get("refresh")

        if not refresh_token:
            return Response(
                {"detail": "Refresh token not found."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Temporarily set refresh token in request data for parent class
        request._full_data = {"refresh": refresh_token}

        response = super().post(request, *args, **kwargs)

        # Set new access token in cookie if refresh was successful
        if response.status_code == 200 and "access" in response.data:
            response.set_cookie(
                key="access",
                value=response.data["access"],
                httponly=True,
                secure=False,  # Set to True in production with HTTPS
                samesite="Lax",
                max_age=86400,  # 1 day
            )

        return response


@extend_schema(
    summary="Get or update current user profile",
    description="Retrieve or update the profile information of the currently authenticated user.",
    request=UserSerializer,
    responses={
        200: OpenApiResponse(
            response=UserSerializer,
            description="User profile data.",
        ),
        400: OpenApiResponse(description="Invalid input data."),
        401: OpenApiResponse(
            description="Authentication credentials were not provided."
        ),
    },
    tags=["User Profile"],
)
@api_view(["GET", "PATCH"])
@permission_classes([permissions.IsAuthenticated])
def get_user_profile(request):
    """Get or update current user profile."""
    if request.method == "GET":
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == "PATCH":
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
