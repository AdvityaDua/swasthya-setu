from django.urls import path
from doctor.views import (
    DoctorReferralListView,
    DoctorCaseDetailView,
    DoctorReviewCreateView,
    DoctorCloseReferralView,
    DoctorMeView,
    DoctorConsultationListView,
    DoctorConsultationDetailView,
    DoctorConsultationScheduleView,
    DoctorConsultationRejectView,
    DoctorConsultationRescheduleView,
)

urlpatterns = [
    path("me/", DoctorMeView.as_view()),
    path("referrals/", DoctorReferralListView.as_view()),
    path("cases/<uuid:test_id>/", DoctorCaseDetailView.as_view()),
    path("referrals/<int:referral_id>/review/", DoctorReviewCreateView.as_view()),
    path("referrals/<int:referral_id>/close/", DoctorCloseReferralView.as_view()),
    path("consultations/", DoctorConsultationListView.as_view()),
    path("consultations/<uuid:consultation_id>/", DoctorConsultationDetailView.as_view()),
    path("consultations/<uuid:consultation_id>/schedule/", DoctorConsultationScheduleView.as_view()),
    path("consultations/<uuid:consultation_id>/reject/", DoctorConsultationRejectView.as_view()),
    path("consultations/<uuid:consultation_id>/reschedule/", DoctorConsultationRescheduleView.as_view()),
]
