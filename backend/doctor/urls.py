from django.urls import path
from doctor.views import (
    DoctorReferralListView,
    DoctorCaseDetailView,
    DoctorReviewCreateView,
    DoctorCloseReferralView
)

urlpatterns = [
    path("referrals/", DoctorReferralListView.as_view()),
    path("cases/<uuid:test_id>/", DoctorCaseDetailView.as_view()),
    path("referrals/<int:referral_id>/review/", DoctorReviewCreateView.as_view()),
    path("referrals/<int:referral_id>/close/", DoctorCloseReferralView.as_view()),
]