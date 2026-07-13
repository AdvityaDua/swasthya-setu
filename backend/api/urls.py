from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('api/', include('core.urls')),
    path('api/patient/', include('patient.urls')),
    path('api/practitioner/', include('practitioner.urls')),
    path('api/doctor/', include('doctor.urls')),
    path('api/chatbot/', include('chatbot.urls')),
]

if settings.DEBUG:
    # Serve media files during development
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    # Also serve reports under /reports/ for compatibility with existing links
    urlpatterns += static('/reports/', document_root=getattr(settings, 'REPORTS_ROOT', settings.MEDIA_ROOT))
