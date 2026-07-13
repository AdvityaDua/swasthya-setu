from django.urls import path
from . import views

urlpatterns = [
    path('query/', views.query_chatbot, name='query_chatbot'),
    path('whatsapp/', views.whatsapp_webhook, name='whatsapp_webhook'),
]
