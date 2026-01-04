from core.views import RegisterView, LoginView, RefreshTokenView, LogoutView
from django.urls import path

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/refresh-token/', RefreshTokenView.as_view(), name='refresh_token'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
]

