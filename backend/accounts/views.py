from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .serializers import (
    CustomTokenObtainPairSerializer,
    PasswordChangeSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
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


@extend_schema(
    summary="Change user password",
    description="Change the password for the currently authenticated user. Requires current password verification.",
    request=PasswordChangeSerializer,
    responses={
        200: OpenApiResponse(
            description="Password changed successfully.",
            examples={
                "application/json": {
                    "message": "Password changed successfully.",
                }
            },
        ),
        400: OpenApiResponse(description="Invalid input data or incorrect current password."),
        401: OpenApiResponse(
            description="Authentication credentials were not provided."
        ),
    },
    tags=["User Profile"],
)
@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    """Change user password."""
    serializer = PasswordChangeSerializer(
        data=request.data, context={"request": request}
    )
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(
        {"message": "Password changed successfully."},
        status=status.HTTP_200_OK,
    )


@extend_schema(
    summary="Request password reset",
    description="Request a password reset link to be sent to the user's email address.",
    request=PasswordResetRequestSerializer,
    responses={
        200: OpenApiResponse(
            description="Password reset email sent successfully (if email exists).",
            examples={
                "application/json": {
                    "message": "If the email exists, a password reset link has been sent.",
                }
            },
        ),
        400: OpenApiResponse(description="Invalid email address."),
    },
    tags=["Authentication"],
)
@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def password_reset_request(request):
    """Request password reset."""
    serializer = PasswordResetRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data["email"]
    User = get_user_model()

    try:
        user = User.objects.get(email=email, is_active=True)
        # Generate reset token
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        reset_token = f"{uid}.{token}"

        # Create reset URL
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
        reset_url = f"{frontend_url}/reset-password?token={reset_token}"

        # Send email
        send_mail(
            subject="Password Reset Request",
            message=f"Click the following link to reset your password:\n\n{reset_url}\n\nThis link will expire in 1 hour.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
    except User.DoesNotExist:
        # Don't reveal if email exists or not for security
        pass

    # Always return success message to prevent email enumeration
    return Response(
        {"message": "If the email exists, a password reset link has been sent."},
        status=status.HTTP_200_OK,
    )


@extend_schema(
    summary="Confirm password reset",
    description="Reset the user's password using the token from the reset email.",
    request=PasswordResetConfirmSerializer,
    responses={
        200: OpenApiResponse(
            description="Password reset successfully.",
            examples={
                "application/json": {
                    "message": "Password has been reset successfully.",
                }
            },
        ),
        400: OpenApiResponse(description="Invalid or expired token."),
    },
    tags=["Authentication"],
)
@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def password_reset_confirm(request):
    """Confirm password reset."""
    serializer = PasswordResetConfirmSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(
        {"message": "Password has been reset successfully."},
        status=status.HTTP_200_OK,
    )
