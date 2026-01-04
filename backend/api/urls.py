from django.urls import path, include

urlpatterns = [
    path('api/', include('core.urls')),
    path('api/patient/', include('patient.urls')),
    path('api/practitioner/', include('practitioner.urls'))
]
