from rest_framework.views import APIView, Response, status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.http import FileResponse
from django.db.models import Q

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
from practitioner.services.ai_service import run_ai_and_generate_report, generate_report


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
            'image': request.build_absolute_uri(test.raw_image.url) if test.raw_image else None,
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
                'prediction_label': ai_result.prediction_label,
                'heatmap': request.build_absolute_uri(ai_result.heatmap_image.url) if ai_result.heatmap_image else None,
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
        patient = test.patient
        
        # Capture current health profile snapshot
        history_snapshot = {
            "known_allergies": patient.known_allergies,
            "chronic_conditions": patient.chronic_conditions,
            "past_surgeries": patient.past_surgeries,
            "current_medications": patient.current_medications,
            "lifestyle_indicators": patient.lifestyle_indicators,
            "medical_history": patient.medical_history,
        }

        ClinicalContext.objects.update_or_create(
            test=test,
            defaults={
                "symptoms": serializer.validated_data["symptoms"],
                "vitals": serializer.validated_data.get("vitals"),
                "auto_history_snapshot": history_snapshot,
                "entered_by": request.user
            }
        )

        return Response({"message": "Clinical context saved"})


class ViewAIResultView(APIView):
    permission_classes = [IsAuthenticated, IsPractitioner]

    def get(self, request, test_id):
        ai = get_object_or_404(AIInferenceResult, test__id=test_id)
        serializer = AIResultSerializer(ai, context={'request': request})
        print(f"DEBUG: ViewAIResultView - Data: {serializer.data}")
        return Response(serializer.data)


class PractitionerReportDownloadView(APIView):
    permission_classes = [IsAuthenticated, IsPractitioner]

    def get(self, request, test_id):
        lang = request.query_params.get('lang', 'en')
        report = get_object_or_404(
            DiagnosticReport,
            test__id=test_id,
        )

        if lang == 'en':
            return FileResponse(
                report.report_pdf.open(),
                as_attachment=True,
                filename=f"report_{test_id}.pdf"
            )
        
        try:
            test = report.test
            ai_result = AIInferenceResult.objects.get(test=test)
            clinical_context = getattr(test, 'clinicalcontext', None)
            
            translated_pdf = generate_report(test, ai_result, clinical_context, target_lang=lang)
            
            return FileResponse(
                translated_pdf,
                as_attachment=True,
                filename=f"report_{test_id}_{lang}.pdf"
            )
        except Exception:
            return FileResponse(
                report.report_pdf.open(),
                as_attachment=True,
                filename=f"report_{test_id}.pdf"
            )


class RegenerateReportView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, test_id):
        test = get_object_or_404(DiagnosticTest, id=test_id)
        language = request.data.get('language', 'en')
        
        try:
            ai_result = AIInferenceResult.objects.get(test=test)
            clinical_context = getattr(test, 'clinicalcontext', None)
            
            # Generate new PDF
            pdf = generate_report(test, ai_result, clinical_context, target_lang=language)
            
            # Update the existing report record (overwrite)
            report, created = DiagnosticReport.objects.update_or_create(
                test=test,
                defaults={
                    "report_pdf": pdf,
                    # We might want to keep the doctors signature if it was signed, 
                    # but usually regenerating implies a draft state. 
                    # For now let's keep it simple and just update the pdf.
                }
            )
            
            # Return the new file URL
            report_url = request.build_absolute_uri(report.report_pdf.url)
            return Response({"report_url": report_url}, status=status.HTTP_200_OK)
            
        except AIInferenceResult.DoesNotExist:
             return Response({"error": "AI Inference result not found for this test."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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

        language = request.data.get('language', 'en')
        ai_result = run_ai_and_generate_report(test, target_lang=language)

        test.status = "AI_DONE"
        test.save(update_fields=["status"])

        return Response(AIResultSerializer(ai_result, context={'request': request}).data)


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
                    'confidence': ai_result.confidence,
                    'prediction_label': ai_result.prediction_label,
                    'heatmap': request.build_absolute_uri(ai_result.heatmap_image.url) if ai_result.heatmap_image else None,
                }
                try:
                    report = DiagnosticReport.objects.filter(test=ai_result.test).first()
                    if report and report.report_pdf:
                        test_dict['ai_result']['report_pdf'] = request.build_absolute_uri(report.report_pdf.url)
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
                    'confidence': ai_result.confidence,
                    'prediction_label': ai_result.prediction_label,
                    'heatmap': request.build_absolute_uri(ai_result.heatmap_image.url) if ai_result.heatmap_image else None,
                }
                try:
                    report = DiagnosticReport.objects.filter(test=ai_result.test).first()
                    if report and report.report_pdf:
                        test_dict['ai_result']['report_pdf'] = request.build_absolute_uri(report.report_pdf.url)
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
            'BREAST_CANCER': 'BREAST_CANCER',
            'DIABETIC_RETINOPATHY': 'DIABETIC_RETINOPATHY',
            'PNEUMONIA': 'PNEUMONIA',
            'FRACTURE': 'FRACTURE',
        }
        
        doctors = DoctorProfile.objects.select_related('user').filter(user__is_active=True)
        
        # Filter by specialization if test_type is provided
        if test_type and test_type in test_to_spec_map:
            specialization = test_to_spec_map[test_type]
            doctors = doctors.filter(Q(specialization=specialization) | Q(specialization='GENERAL'))
        
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