from django.contrib.auth import get_user_model
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

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

        return Response(
            {
                "user": UserSerializer(user).data,
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "message": "User registered successfully.",
            },
            status=status.HTTP_201_CREATED,
        )


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
        return super().post(request, *args, **kwargs)


@extend_schema(
    summary="Get current user profile",
    description="Retrieve the profile information of the currently authenticated user.",
    responses={
        200: OpenApiResponse(
            response=UserSerializer,
            description="User profile data.",
        ),
        401: OpenApiResponse(
            description="Authentication credentials were not provided."
        ),
    },
    tags=["User Profile"],
)
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def get_user_profile(request):
    """Get current user profile."""
    serializer = UserSerializer(request.user)
    return Response(serializer.data, status=status.HTTP_200_OK)
