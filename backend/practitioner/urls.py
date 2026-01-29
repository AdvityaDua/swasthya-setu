from django.urls import path
from practitioner.views import (
    PatientLookupView,
    DiagnosticTestCreateView,
    DiagnosticTestDetailView,
    DiagnosticImageUploadView,
    ClinicalContextCreateView,
    RunAITestView,
    ViewAIResultView,
    ReferralCreateView,
    PractitionerMeView,
    PractitionerActiveTestsView,
    PractitionerClosedTestsView,
    PractitionerDoctorListView,
    PractitionerReportDownloadView,
)


urlpatterns = [
    path("me/", PractitionerMeView.as_view()),
    path("patient-search/", PatientLookupView.as_view()),
    path("tests/active/", PractitionerActiveTestsView.as_view()),
    path("tests/closed/", PractitionerClosedTestsView.as_view()),
    path("tests/create/", DiagnosticTestCreateView.as_view()),
    path("tests/<uuid:test_id>/", DiagnosticTestDetailView.as_view()),
    path("tests/<uuid:test_id>/upload/", DiagnosticImageUploadView.as_view()),
    path("tests/<uuid:test_id>/context/", ClinicalContextCreateView.as_view()),
    path("tests/<uuid:test_id>/run-ai/", RunAITestView.as_view()),
    path("tests/<uuid:test_id>/ai-result/", ViewAIResultView.as_view()),
    path("tests/<uuid:test_id>/refer/", ReferralCreateView.as_view()),
    path("tests/<uuid:test_id>/report/", PractitionerReportDownloadView.as_view()),
    path("doctors/", PractitionerDoctorListView.as_view()),
]