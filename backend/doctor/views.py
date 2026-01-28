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
        
        # Create Google Calendar event
        doctor_email = request.user.email
        patient_email = consultation.patient.user.email
        patient_name = consultation.patient.user.full_name
        
        calendar_result = create_consultation_event(
            doctor_email=doctor_email,
            patient_email=patient_email,
            patient_name=patient_name,
            scheduled_time=scheduled_time,
            consultation_request_id=str(consultation.id)
        )
        
        if not calendar_result.get('success'):
            return Response(
                {'detail': 'Failed to create calendar event', 'error': calendar_result.get('error')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update consultation with meeting details
        consultation.scheduled_time = scheduled_time
        consultation.meet_link = calendar_result.get('meet_link')
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
