from rest_framework.views import APIView, Response, status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from doctor.permissions import IsDoctor
from doctor.serializers import (
    DoctorReferralListSerializer,
    DoctorCaseDetailSerializer,
    DoctorReviewSerializer
)
from core.models import (
    Referral,
    DiagnosticTest
)
from doctor.models import DoctorReview


class DoctorReferralListView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    def get(self, request):
        referrals = Referral.objects.filter(
            referred_to=request.user.doctor_profile,
            status="PENDING"
        ).select_related("test", "test__patient", "test__patient__user")

        serializer = DoctorReferralListSerializer(referrals, many=True)
        return Response(serializer.data)





class DoctorCaseDetailView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    def get(self, request, test_id):
        test = get_object_or_404(
            DiagnosticTest,
            id=test_id,
            referral__referred_to=request.user.doctor_profile
        )

        serializer = DoctorCaseDetailSerializer(test)
        return Response(serializer.data)


class DoctorReviewCreateView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    def post(self, request, referral_id):
        serializer = DoctorReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        referral = get_object_or_404(
            Referral,
            id=referral_id,
            referred_to=request.user.doctor_profile
        )

        DoctorReview.objects.create(
            referral=referral,
            doctor=request.user.doctor_profile,
            **serializer.validated_data
        )

        referral.status = "REVIEWED"
        referral.save()

        return Response({"message": "Review submitted"})


class DoctorCloseReferralView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    def post(self, request, referral_id):
        referral = get_object_or_404(
            Referral,
            id=referral_id,
            referred_to=request.user.doctor_profile
        )

        referral.status = "CLOSED"
        referral.save()

        return Response({"message": "Referral closed"})