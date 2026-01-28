from django.urls import path
from patient.views import (
    PatientMeView,
    PatientTestListView,
    PatientTestDetailView,
    PatientReportDownloadView,
    PatientAppointmentListView,
    PatientAppointmentCreateView,
    PatientPractitionerListView,
    PatientDoctorListView,
    PatientConsultationRequestView,
    PatientConsultationListView,
    PatientConsultationDetailView,
    PatientReferralListView,
    PatientMedicalHistoryView,
)

urlpatterns = [
    path('me/', PatientMeView.as_view()),
    path('tests/', PatientTestListView.as_view()),
    path('tests/<test_id>/', PatientTestDetailView.as_view()),
    path('reports/<test_id>/', PatientReportDownloadView.as_view()),
    path('medical-history/', PatientMedicalHistoryView.as_view()),
    path('appointments/', PatientAppointmentListView.as_view()),
    path('appointments/book/', PatientAppointmentCreateView.as_view()),
    path('practitioners/', PatientPractitionerListView.as_view()),
    path('doctors/', PatientDoctorListView.as_view()),
    path('consultations/request/', PatientConsultationRequestView.as_view()),
    path('consultations/', PatientConsultationListView.as_view()),
    path('consultations/<consultation_id>/', PatientConsultationDetailView.as_view()),
    path('referrals/', PatientReferralListView.as_view())
]
