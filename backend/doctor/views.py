from rest_framework.views import APIView, Response, status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone

from doctor.permissions import IsDoctor
from doctor.serializers import (
    DoctorReferralListSerializer,
    DoctorCaseDetailSerializer,
    DoctorReviewSerializer,
    DoctorProfileSerializer,
    DoctorReviewedCaseSerializer,
)
from core.models import Referral, DiagnosticTest, ConsultationRequest
from doctor.models import DoctorReview
from patient.serializers import ConsultationRequestSerializer, ConsultationScheduleSerializer
from core.services.google_calendar import create_consultation_event, cancel_consultation_event


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


class DoctorMeView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    def get(self, request):
        profile = request.user.doctor_profile
        serializer = DoctorProfileSerializer(profile)
        return Response(serializer.data)

    def patch(self, request):
        profile = request.user.doctor_profile
        serializer = DoctorProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class DoctorConsultationListView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    def get(self, request):
        """List all consultations for the doctor"""
        doctor = request.user.doctor_profile
        status_filter = request.query_params.get('status')
        
        consultations = ConsultationRequest.objects.filter(
            doctor=doctor
        ).order_by('-requested_at')
        
        if status_filter:
            consultations = consultations.filter(status=status_filter)
        
        serializer = ConsultationRequestSerializer(consultations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DoctorConsultationDetailView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    def get(self, request, consultation_id):
        """Get details of a specific consultation"""
        consultation = get_object_or_404(
            ConsultationRequest,
            id=consultation_id,
            doctor=request.user.doctor_profile
        )
        serializer = ConsultationRequestSerializer(consultation)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DoctorConsultationScheduleView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    def post(self, request, consultation_id):
        """Schedule a consultation and create Google Calendar event with Meet link"""
        consultation = get_object_or_404(
            ConsultationRequest,
            id=consultation_id,
            doctor=request.user.doctor_profile,
            status='PENDING'
        )
        
        serializer = ConsultationScheduleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        scheduled_time = serializer.validated_data['scheduled_time']
        manual_link = serializer.validated_data.get('meet_link')
        
        print(f"DEBUG: Manual Link received: {manual_link}")

        # Create Google Calendar event
        doctor_email = request.user.email
        patient_email = consultation.patient.user.email
        patient_name = consultation.patient.user.full_name
        
        # Try to create calendar event regardless (for tracking), but use manual link if provided
        calendar_result = create_consultation_event(
            doctor_email=doctor_email,
            patient_email=patient_email,
            patient_name=patient_name,
            scheduled_time=scheduled_time,
            consultation_request_id=str(consultation.id)
        )
        
        print(f"DEBUG: Calendar Result: {calendar_result}")

        # We don't fail strictly if calendar fails, as long as we have a link or plan to just schedule
        # However, if calendar fails, we log it.
        
        generated_link = calendar_result.get('meet_link')
        final_link = manual_link if manual_link else generated_link
        
        print(f"DEBUG: Final Link to save: {final_link}")

        # Update consultation with meeting details
        consultation.scheduled_time = scheduled_time
        consultation.meet_link = final_link
        consultation.calendar_event_id = calendar_result.get('calendar_event_id')
        consultation.status = 'SCHEDULED'
        consultation.save()
        
        response_serializer = ConsultationRequestSerializer(consultation)
        return Response(response_serializer.data, status=status.HTTP_200_OK)


class DoctorConsultationRejectView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    def post(self, request, consultation_id):
        """Reject a consultation request"""
        consultation = get_object_or_404(
            ConsultationRequest,
            id=consultation_id,
            doctor=request.user.doctor_profile,
            status='PENDING'
        )
        
        reason = request.data.get('reason', 'No reason provided')
        
        consultation.status = 'REJECTED'
        consultation.save()
        
        response_data = ConsultationRequestSerializer(consultation).data
        response_data['rejection_reason'] = reason
        
        return Response(response_data, status=status.HTTP_200_OK)


class DoctorConsultationRescheduleView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    def post(self, request, consultation_id):
        """Reschedule a consultation"""
        consultation = get_object_or_404(
            ConsultationRequest,
            id=consultation_id,
            doctor=request.user.doctor_profile,
            status__in=['SCHEDULED', 'PENDING']
        )
        
        serializer = ConsultationScheduleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        new_scheduled_time = serializer.validated_data['scheduled_time']
        
        # If already scheduled, update the calendar event
        if consultation.calendar_event_id:
            from core.services.google_calendar import update_consultation_event
            update_result = update_consultation_event(
                calendar_event_id=consultation.calendar_event_id,
                scheduled_time=new_scheduled_time
            )
            
            if not update_result.get('success'):
                return Response(
                    {'detail': 'Failed to update calendar event'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            # Create new calendar event if not already scheduled
            doctor_email = request.user.email
            patient_email = consultation.patient.user.email
            patient_name = consultation.patient.user.full_name
            
            calendar_result = create_consultation_event(
                doctor_email=doctor_email,
                patient_email=patient_email,
                patient_name=patient_name,
                scheduled_time=new_scheduled_time,
                consultation_request_id=str(consultation.id)
            )
            
            if not calendar_result.get('success'):
                return Response(
                    {'detail': 'Failed to create calendar event'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            consultation.meet_link = calendar_result.get('meet_link')
            consultation.calendar_event_id = calendar_result.get('calendar_event_id')
        
        consultation.scheduled_time = new_scheduled_time
        consultation.status = 'SCHEDULED'
        consultation.save()
        
        response_serializer = ConsultationRequestSerializer(consultation)
        return Response(response_serializer.data, status=status.HTTP_200_OK)


class DoctorConsultationCancelView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    def post(self, request, consultation_id):
        """Cancel a scheduled consultation"""
        consultation = get_object_or_404(
            ConsultationRequest,
            id=consultation_id,
            doctor=request.user.doctor_profile,
            status='SCHEDULED'
        )
        
        print(f"DEBUG: Raw Request Data: {request.data}")
        
        reason = request.data.get('reason', 'No reason provided')
        
        # Cancel Google Calendar event if exists
        if consultation.calendar_event_id:
            from core.services.google_calendar import cancel_consultation_event
            cancel_result = cancel_consultation_event(
                calendar_event_id=consultation.calendar_event_id,
                doctor_email=request.user.email
            )
            # Log error but don't block cancellation
            if not cancel_result.get('success'):
                print(f"Failed to cancel calendar event: {cancel_result.get('error')}")

        consultation.status = 'CANCELLED'
        consultation.save()
        
        response_data = ConsultationRequestSerializer(consultation).data
        response_data['cancellation_reason'] = reason
        
        return Response(response_data, status=status.HTTP_200_OK)


class DoctorDashboardStatsView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    def get(self, request):
        doctor_profile = request.user.doctor_profile
        today = timezone.now().date()
        
        pending_referrals_count = Referral.objects.filter(
            referred_to=doctor_profile,
            status="PENDING"
        ).count()
        
        reviewed_today_count = DoctorReview.objects.filter(
            doctor=doctor_profile,
            reviewed_at__date=today
        ).count()
        
        return Response({
            "pending_referrals_count": pending_referrals_count,
            "reviewed_today_count": reviewed_today_count
        })
class DoctorDirectScheduleView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    def post(self, request):
        """
        Directly schedule a consultation without a prior patient request.
        """
        patient_id = request.data.get("patient_id")
        scheduled_time = request.data.get("scheduled_time")
        
        if not patient_id or not scheduled_time:
            return Response(
                {"detail": "patient_id and scheduled_time are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify patient exists
        from core.models import PatientProfile
        patient = get_object_or_404(PatientProfile, id=patient_id)
        doctor = request.user.doctor_profile

        # Create consultation
        consultation = ConsultationRequest.objects.create(
            patient=patient,
            doctor=doctor,
            status="SCHEDULED",
            scheduled_time=scheduled_time
        )

        # Create Google Calendar event
        doctor_email = request.user.email
        patient_email = patient.user.email
        patient_name = patient.user.full_name
        
        calendar_result = create_consultation_event(
            doctor_email=doctor_email,
            patient_email=patient_email,
            patient_name=patient_name,
            scheduled_time=scheduled_time,
            consultation_request_id=str(consultation.id)
        )
        
        print(f"DEBUG: Direct Schedule Calendar Result: {calendar_result}")

        # Update with link
        consultation.meet_link = calendar_result.get('meet_link')
        consultation.calendar_event_id = calendar_result.get('calendar_event_id')
        consultation.save()

        # Serialize using the same serializer as normal consultations
        serializer = ConsultationRequestSerializer(consultation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class DoctorReviewedCasesView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    def get(self, request):
        reviews = DoctorReview.objects.filter(
            doctor=request.user.doctor_profile
        ).select_related("referral", "referral__test", "referral__test__patient", "referral__test__patient__user").order_by("-reviewed_at")
        
        serializer = DoctorReviewedCaseSerializer(reviews, many=True)
        return Response(serializer.data)
