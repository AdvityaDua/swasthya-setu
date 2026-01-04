from django.urls import path
from practitioner.views import (
    PatientLookupView,
    DiagnosticTestCreateView,
    DiagnosticImageUploadView,
    ClinicalContextCreateView,
    RunAIInferenceView,
    ViewAIResultView,
    ReferralCreateView
)


urlpatterns = [
    path("patient-search/", PatientLookupView.as_view()),
    path("tests/create/", DiagnosticTestCreateView.as_view()),
    path("tests/<uuid:test_id>/upload/", DiagnosticImageUploadView.as_view()),
    path("tests/<uuid:test_id>/context/", ClinicalContextCreateView.as_view()),
    path("tests/<uuid:test_id>/run-ai/", RunAIInferenceView.as_view()),
    path("tests/<uuid:test_id>/ai-result/", ViewAIResultView.as_view()),
    path("tests/<uuid:test_id>/refer/", ReferralCreateView.as_view()),
]