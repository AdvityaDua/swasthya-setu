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
    ReferralCreateSerializer,
    PractitionerProfileSerializer,
)
from core.models import (
    PatientProfile,
    DiagnosticTest,
    ClinicalContext,
    Referral,
    AIInferenceResult
)
from core.models import DiagnosticReport
from practitioner.services.ai_service import run_ai_and_generate_report


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


class DiagnosticTestDetailView(APIView):
    permission_classes = [IsAuthenticated, IsPractitioner]

    def get(self, request, test_id):
        """Get details of a specific diagnostic test"""
        test = get_object_or_404(DiagnosticTest, id=test_id, practitioner=request.user.practitioner_profile)
        
        test_data = {
            'id': test.id,
            'patient': test.patient.id,
            'patient_name': test.patient.user.full_name,
            'test_type': test.test_type,
            'status': test.status,
            'created_at': test.created_at,
            'image': str(test.raw_image.url) if test.raw_image else None,
        }
        
        # Include clinical context if available
        try:
            clinical_context = test.clinicalcontext
            test_data['clinical_context'] = {
                'symptoms': clinical_context.symptoms,
                'vitals': clinical_context.vitals
            }
        except ClinicalContext.DoesNotExist:
            pass
        
        # Include AI result if available
        try:
            ai_result = test.aiinferenceresult
            test_data['ai_result'] = {
                'risk_level': ai_result.risk_level,
                'risk_score': ai_result.risk_score,
                'confidence': ai_result.confidence,
                'heatmap': str(ai_result.heatmap_image.url) if ai_result.heatmap_image else None,
            }
        except AIInferenceResult.DoesNotExist:
            pass
        
        # Include referral info if available
        try:
            referral = test.referral
            test_data['referral'] = {
                'id': referral.id,
                'referred_to_id': referral.referred_to.id if referral.referred_to else None,
                'referred_to_name': f"Dr. {referral.referred_to.user.full_name}" if referral.referred_to else None,
                'urgency': referral.urgency,
                'reason': referral.reason,
                'status': referral.status,
            }
        except Referral.DoesNotExist:
            test_data['referral'] = None
        
        return Response(test_data, status=status.HTTP_200_OK)


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

        # Check if referral already exists; if so, update it
        referral, created = Referral.objects.get_or_create(
            test=test,
            defaults={
                "referred_by": request.user.practitioner_profile,
                **serializer.validated_data
            }
        )

        # If referral already existed, update it with new data
        if not created:
            for field, value in serializer.validated_data.items():
                setattr(referral, field, value)
            referral.save()

        test.status = "REFERRED"
        test.save()

        return Response({"message": "Referral created" if created else "Referral updated"})


class RunAITestView(APIView):
    permission_classes = [IsAuthenticated, IsPractitioner]

    def post(self, request, test_id):
        test = get_object_or_404(
            DiagnosticTest,
            id=test_id,
            practitioner=request.user.practitioner_profile
        )

        ai_result = run_ai_and_generate_report(test)

        test.status = "AI_DONE"
        test.save(update_fields=["status"])

        return Response(AIResultSerializer(ai_result).data)


class PractitionerActiveTestsView(APIView):
    permission_classes = [IsAuthenticated, IsPractitioner]

    def get(self, request):
        """Get all active/in-progress tests for the practitioner"""
        practitioner = request.user.practitioner_profile
        tests = DiagnosticTest.objects.filter(
            practitioner=practitioner
        ).exclude(
            status='CLOSED'
        ).select_related('patient', 'patient__user')
        
        # Format test data for frontend
        tests_data = []
        for test in tests:
            test_dict = {
                'id': test.id,
                'patient': test.patient.id,
                'patient_name': test.patient.user.full_name,
                'test_type': test.test_type,
                'status': test.status,
                'created_at': test.created_at,
                'ai_result': None
            }
            
            # Include AI result if available
            try:
                ai_result = test.aiinferenceresult
                test_dict['ai_result'] = {
                    'risk_level': ai_result.risk_level,
                    'risk_score': ai_result.risk_score,
                    'confidence': ai_result.confidence
                }
                try:
                    report = DiagnosticReport.objects.filter(test=ai_result.test).first()
                    if report and report.report_pdf:
                        test_dict['ai_result']['report_pdf'] = report.report_pdf.url
                except Exception:
                    pass
            except AIInferenceResult.DoesNotExist:
                pass
            
            tests_data.append(test_dict)
        
        return Response(tests_data, status=status.HTTP_200_OK)


class PractitionerClosedTestsView(APIView):
    permission_classes = [IsAuthenticated, IsPractitioner]

    def get(self, request):
        """Get all closed/completed tests for the practitioner"""
        practitioner = request.user.practitioner_profile
        tests = DiagnosticTest.objects.filter(
            practitioner=practitioner,
            status='CLOSED'
        ).select_related('patient', 'patient__user')
        
        # Format test data for frontend
        tests_data = []
        for test in tests:
            test_dict = {
                'id': test.id,
                'patient': test.patient.id,
                'patient_name': test.patient.user.full_name,
                'test_type': test.test_type,
                'status': test.status,
                'created_at': test.created_at,
                'ai_result': None
            }
            
            # Include AI result if available
            try:
                ai_result = test.aiinferenceresult
                test_dict['ai_result'] = {
                    'risk_level': ai_result.risk_level,
                    'risk_score': ai_result.risk_score,
                    'confidence': ai_result.confidence
                }
                try:
                    report = DiagnosticReport.objects.filter(test=ai_result.test).first()
                    if report and report.report_pdf:
                        test_dict['ai_result']['report_pdf'] = report.report_pdf.url
                except Exception:
                    pass
            except AIInferenceResult.DoesNotExist:
                pass
            
            tests_data.append(test_dict)
        
        return Response(tests_data, status=status.HTTP_200_OK)


class PractitionerDoctorListView(APIView):
    permission_classes = [IsAuthenticated, IsPractitioner]

    def get(self, request):
        from core.models import DoctorProfile
        from doctor.serializers import DoctorListSerializer
        
        test_type = request.query_params.get('test_type')
        
        # Map test types to doctor specializations
        test_to_spec_map = {
            'TB': 'TB',
            'BREAST_CANCER': 'ONCOLOGY',
            'DIABETIC': 'GENERAL',
        }
        
        doctors = DoctorProfile.objects.select_related('user').filter(user__is_active=True)
        
        # Filter by specialization if test_type is provided
        if test_type and test_type in test_to_spec_map:
            specialization = test_to_spec_map[test_type]
            doctors = doctors.filter(specialization=specialization)
        
        serializer = DoctorListSerializer(doctors, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PractitionerMeView(APIView):
    permission_classes = [IsAuthenticated, IsPractitioner]

    def get(self, request):
        profile = request.user.practitioner_profile
        serializer = PractitionerProfileSerializer(profile)
        return Response(serializer.data)

    def patch(self, request):
        profile = request.user.practitioner_profile
        serializer = PractitionerProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)