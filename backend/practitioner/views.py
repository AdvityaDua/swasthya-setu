from rest_framework.views import APIView, Response, status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from practitioner.permissions import IsPractitioner
from practitioner.serializers import (
    PatientLookupSerializer,
    DiagnosticTestCreateSerializer,
    DiagnosticImageUploadSerializer,
    ClinicalContextSerializer,
    AIResultSerializer,
    ReferralCreateSerializer
)
from core.models import (
    PatientProfile,
    DiagnosticTest,
    ClinicalContext,
    Referral
)


class PatientLookupView(APIView):
    permission_classes = [IsAuthenticated, IsPractitioner]

    def get(self, request):
        abha_id = request.query_params.get("abha_id")
        phone = request.query_params.get("phone")

        if not abha_id and not phone:
            return Response(
                {"error": "abha_id or phone is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        qs = PatientProfile.objects.select_related("user")

        if abha_id:
            qs = qs.filter(user__abha_id=abha_id)
        if phone:
            qs = qs.filter(user__phone=phone)

        serializer = PatientLookupSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DiagnosticTestCreateView(APIView):
    permission_classes = [IsAuthenticated, IsPractitioner]

    def post(self, request):
        serializer = DiagnosticTestCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        test = serializer.save(
            practitioner=request.user.practitioner_profile,
            status="UPLOADED"
        )

        return Response(
            {"test_id": test.id},
            status=201
        )


class DiagnosticImageUploadView(APIView):
    permission_classes = [IsAuthenticated, IsPractitioner]

    def post(self, request, test_id):
        serializer = DiagnosticImageUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        test = get_object_or_404(
            DiagnosticTest,
            id=test_id,
            practitioner=request.user.practitioner_profile
        )

        test.raw_image = serializer.validated_data["image"]
        test.save()

        return Response({"message": "Image uploaded"})
    

class ClinicalContextCreateView(APIView):
    permission_classes = [IsAuthenticated, IsPractitioner]

    def post(self, request, test_id):
        serializer = ClinicalContextSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        test = get_object_or_404(DiagnosticTest, id=test_id)

        ClinicalContext.objects.create(
            test=test,
            symptoms=serializer.validated_data["symptoms"],
            vitals=serializer.validated_data.get("vitals"),
            auto_history_snapshot={},
            entered_by=request.user
        )

        return Response({"message": "Clinical context saved"})


from practitioner.services.ai import run_ai
from core.models import AIInferenceResult


class RunAIInferenceView(APIView):
    permission_classes = [IsAuthenticated, IsPractitioner]

    def post(self, request, test_id):
        test = get_object_or_404(DiagnosticTest, id=test_id)

        result = run_ai(test)

        AIInferenceResult.objects.create(
            test=test,
            model_name=test.test_type,
            **result
        )

        test.status = "AI_DONE"
        test.save()

        return Response(result)
    

class ViewAIResultView(APIView):
    permission_classes = [IsAuthenticated, IsPractitioner]

    def get(self, request, test_id):
        ai = get_object_or_404(AIInferenceResult, test__id=test_id)
        serializer = AIResultSerializer(ai)
        return Response(serializer.data)


class ReferralCreateView(APIView):
    permission_classes = [IsAuthenticated, IsPractitioner]

    def post(self, request, test_id):
        serializer = ReferralCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        test = get_object_or_404(DiagnosticTest, id=test_id)

        Referral.objects.create(
            test=test,
            referred_by=request.user.practitioner_profile,
            **serializer.validated_data
        )

        test.status = "REFERRED"
        test.save()

        return Response({"message": "Referral created"})