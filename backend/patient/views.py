from rest_framework.views import APIView, Response, status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.http import FileResponse
from django.utils import timezone

from patient.permissions import IsPatient
from patient.serializers import (
    PatientProfileSerializer,
    PatientProfileUpdateSerializer,
    PatientTestListSerializer,
    PatientTestDetailSerializer,
    PatientAppointmentSerializer,
    PatientAppointmentCreateSerializer,
    PatientReferralSerializer,
    ConsultationRequestSerializer,
    ConsultationRequestCreateSerializer,
    ConsultationScheduleSerializer,
)
from core.models import (
    DiagnosticTest,
    DiagnosticReport,
    Appointment,
    Referral,
    ConsultationRequest,
    DoctorProfile,
)
from core.services.google_calendar import create_consultation_event, cancel_consultation_event


class PatientMeView(APIView):
    permission_classes = [IsAuthenticated, IsPatient]

    def get(self, request):
        profile = request.user.patient_profile
        serializer = PatientProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        profile = request.user.patient_profile
        serializer = PatientProfileUpdateSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        out = PatientProfileSerializer(profile)
        return Response(out.data, status=status.HTTP_200_OK)


class PatientTestListView(APIView):
    permission_classes = [IsAuthenticated, IsPatient]

    def get(self, request):
        tests = DiagnosticTest.objects.filter(
            patient=request.user.patient_profile
        ).order_by('-test_date')

        serializer = PatientTestListSerializer(tests, many=True)
        return Response(serializer.data)
    

class PatientTestDetailView(APIView):
    permission_classes = [IsAuthenticated, IsPatient]

    def get(self, request, test_id):
        test = get_object_or_404(
            DiagnosticTest,
            id=test_id,
            patient=request.user.patient_profile
        )

        serializer = PatientTestDetailSerializer(test)
        return Response(serializer.data)


class PatientReportDownloadView(APIView):
    permission_classes = [IsAuthenticated, IsPatient]

    def get(self, request, test_id):
        report = get_object_or_404(
            DiagnosticReport,
            test__id=test_id,
            test__patient=request.user.patient_profile
        )

        return FileResponse(
            report.report_pdf.open(),
            as_attachment=True,
            filename=f"report_{test_id}.pdf"
        )

class PatientAppointmentListView(APIView):
    permission_classes = [IsAuthenticated, IsPatient]

    def get(self, request):
        appointments = Appointment.objects.filter(
            patient=request.user.patient_profile
        ).order_by('-scheduled_time')

        serializer = PatientAppointmentSerializer(appointments, many=True)
        return Response(serializer.data)
    

class PatientAppointmentCreateView(APIView):
    permission_classes = [IsAuthenticated, IsPatient]

    def post(self, request):
        serializer = PatientAppointmentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from core.models import PractitionerProfile
        practitioner = PractitionerProfile.objects.get(
            user__id=serializer.validated_data['practitioner_id']
        )

        appointment = Appointment.objects.create(
            patient=request.user.patient_profile,
            appointment_type=serializer.validated_data['appointment_type'],
            scheduled_time=serializer.validated_data['scheduled_time'],
            mode='IN_PERSON',
            status='BOOKED',
            practitioner=practitioner
        )

        response_serializer = PatientAppointmentSerializer(appointment)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class PatientPractitionerListView(APIView):
    permission_classes = [IsAuthenticated, IsPatient]

    def get(self, request):
        from core.models import PractitionerProfile
        practitioners = PractitionerProfile.objects.all()
        
        data = []
        for practitioner in practitioners:
            data.append({
                'id': practitioner.user.id,
                'name': practitioner.user.full_name,
                'center_name': practitioner.diagnostic_center_name,
                'center_location': practitioner.center_location,
                'services_offered': practitioner.services_offered or [],
                'latitude': float(practitioner.latitude) if practitioner.latitude else None,
                'longitude': float(practitioner.longitude) if practitioner.longitude else None,
            })
        
        return Response(data)


class PatientReferralListView(APIView):
    permission_classes = [IsAuthenticated, IsPatient]

    def get(self, request):
        referrals = Referral.objects.filter(
            test__patient=request.user.patient_profile
        )

        serializer = PatientReferralSerializer(referrals, many=True)
        return Response(serializer.data)


class PatientMedicalHistoryView(APIView):
    permission_classes = [IsAuthenticated, IsPatient]

    def get(self, request):
        profile = request.user.patient_profile
        data = profile.medical_history or {"conditions": [], "surgeries": []}
        return Response(data, status=status.HTTP_200_OK)

    def patch(self, request):
        profile = request.user.patient_profile
        serializer = PatientProfileUpdateSerializer(
            profile,
            data={"medical_history": request.data},
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        data = profile.medical_history or {"conditions": [], "surgeries": []}
        return Response(data, status=status.HTTP_200_OK)


class PatientDoctorListView(APIView):
    permission_classes = [IsAuthenticated, IsPatient]

    def get(self, request):
        from core.models import DoctorProfile
        specialization = request.query_params.get('specialization')
        
        doctors = DoctorProfile.objects.all()
        
        if specialization:
            doctors = doctors.filter(specialization=specialization)
        
        from patient.serializers import DoctorListSerializer
        serializer = DoctorListSerializer(doctors, many=True)
        return Response(serializer.data)


class PatientConsultationRequestView(APIView):
    permission_classes = [IsAuthenticated, IsPatient]

    def post(self, request):
        """Create a new consultation request"""
        serializer = ConsultationRequestCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        consultation = serializer.save()
        
        response_serializer = ConsultationRequestSerializer(consultation)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class PatientConsultationListView(APIView):
    permission_classes = [IsAuthenticated, IsPatient]

    def get(self, request):
        """List all consultations for the patient"""
        patient = request.user.patient_profile
        consultations = ConsultationRequest.objects.filter(
            patient=patient
        ).order_by('-requested_at')
        
        serializer = ConsultationRequestSerializer(consultations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PatientConsultationDetailView(APIView):
    permission_classes = [IsAuthenticated, IsPatient]

    def get(self, request, consultation_id):
        """Get details of a specific consultation"""
        consultation = get_object_or_404(
            ConsultationRequest,
            id=consultation_id,
            patient=request.user.patient_profile
        )
        serializer = ConsultationRequestSerializer(consultation)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, consultation_id):
        """Cancel a consultation request"""
        consultation = get_object_or_404(
            ConsultationRequest,
            id=consultation_id,
            patient=request.user.patient_profile
        )
        
        # Only allow cancellation if not already completed or cancelled
        if consultation.status in ['COMPLETED', 'CANCELLED', 'NO_SHOW']:
            return Response(
                {'detail': f'Cannot cancel consultation with status {consultation.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Cancel Google Calendar event if exists
        if consultation.calendar_event_id:
            cancel_consultation_event(consultation.calendar_event_id)
        
        consultation.status = 'CANCELLED'
        consultation.save()
        
        serializer = ConsultationRequestSerializer(consultation)
        return Response(serializer.data, status=status.HTTP_200_OK)

        return Response({
            'id': consultation.id,
            'status': consultation.status,
            'doctor_name': consultation.doctor.user.full_name,
            'requested_at': consultation.requested_at,
            'message': 'Consultation request sent successfully'
        }, status=status.HTTP_201_CREATED)