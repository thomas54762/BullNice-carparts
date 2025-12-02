from django.urls import path

from .views import (
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    RegisterView,
    change_password,
    get_user_profile,
    password_reset_confirm,
    password_reset_request,
)

app_name = "accounts"

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", CustomTokenObtainPairView.as_view(), name="login"),
    path("token/refresh/", CustomTokenRefreshView.as_view(), name="token_refresh"),
    path("profile/", get_user_profile, name="profile"),
    path("change-password/", change_password, name="change_password"),
    path("password-reset/", password_reset_request, name="password_reset_request"),
    path(
        "password-reset/confirm/", password_reset_confirm, name="password_reset_confirm"
    ),
]
