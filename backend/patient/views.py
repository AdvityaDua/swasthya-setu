from rest_framework.views import APIView, Response, status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.http import FileResponse

from patient.permissions import IsPatient
from patient.serializers import (
    PatientProfileSerializer, 
    PatientTestListSerializer,
    PatientTestDetailSerializer,
    PatientAppointmentSerializer,
    PatientAppointmentCreateSerializer,
    PatientReferralSerializer
)
from core.models import (
    DiagnosticTest,
    DiagnosticReport,
    Appointment,
    Referral
)


class PatientMeView(APIView):
    permission_classes = [IsAuthenticated, IsPatient]

    def get(self, request):
        profile = request.user.patient_profile
        serializer = PatientProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)


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

        Appointment.objects.create(
            patient=request.user.patient_profile,
            appointment_type=serializer.validated_data['appointment_type'],
            scheduled_time=serializer.validated_data['scheduled_time'],
            mode='IN_PERSON',
            status='BOOKED'
        )

        return Response({'message': 'Appointment booked'})


class PatientReferralListView(APIView):
    permission_classes = [IsAuthenticated, IsPatient]

    def get(self, request):
        referrals = Referral.objects.filter(
            test__patient=request.user.patient_profile
        )

        serializer = PatientReferralSerializer(referrals, many=True)
        return Response(serializer.data)