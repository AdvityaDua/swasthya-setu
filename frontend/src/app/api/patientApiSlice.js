import { apiSlice } from './index';

export const patientApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPatientTests: builder.query({
      query: () => "patient/tests/",
      pollingInterval: 15000,
      keepUnusedDataFor: 0,
    }),
    getPatientTestDetail: builder.query({
      query: (test_id) => `patient/tests/${test_id}/`,
      pollingInterval: 15000,
      keepUnusedDataFor: 0,
    }),
    getPatientReferrals: builder.query({
      query: () => "patient/referrals/",
      pollingInterval: 15000,
      keepUnusedDataFor: 0,
    }),
    getPatientProfile: builder.query({
      query: () => "patient/me/",
      providesTags: ["PatientProfile"],
      keepUnusedDataFor: 0,
    }),
    getPatientMedicalHistory: builder.query({
      query: () => "patient/medical-history/",
      keepUnusedDataFor: 0,
    }),
    updatePatientMedicalHistory: builder.mutation({
      query: (body) => ({ url: "patient/medical-history/", method: "PATCH", body }),
    }),
    updatePatientProfile: builder.mutation({
      query: (body) => ({ url: "patient/me/", method: "PATCH", body }),
      invalidatesTags: ["PatientProfile"],
    }),
    getPatientAppointments: builder.query({
      query: () => "patient/appointments/",
      providesTags: ["Appointments"],
      keepUnusedDataFor: 0,
    }),
    bookAppointment: builder.mutation({
      query: (body) => ({ url: "patient/appointments/book/", method: "POST", body }),
      invalidatesTags: ["Appointments"],
    }),
    getPractitioners: builder.query({
      query: () => "patient/practitioners/",
      keepUnusedDataFor: 0,
    }),
    getDoctors: builder.query({
      query: (specialization) => {
        const params = new URLSearchParams();
        if (specialization) {
          params.append('specialization', specialization);
        }
        return `patient/doctors/?${params.toString()}`;
      },
      keepUnusedDataFor: 0,
    }),
    requestConsultation: builder.mutation({
      query: (doctor_id) => ({ 
        url: "patient/consultations/request/", 
        method: "POST", 
        body: { doctor_id } 
      }),
      invalidatesTags: ["PatientConsultations"],
    }),
    getPatientConsultations: builder.query({
      query: () => "patient/consultations/",
      providesTags: ["PatientConsultations"],
      keepUnusedDataFor: 0,
    }),
    getPatientConsultationDetail: builder.query({
      query: (consultation_id) => `patient/consultations/${consultation_id}/`,
      keepUnusedDataFor: 0,
    }),
    cancelConsultation: builder.mutation({
      query: (consultation_id) => ({
        url: `patient/consultations/${consultation_id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["PatientConsultations"],
    }),
  }),
});

export const {
  useGetPatientTestsQuery,
  useGetPatientTestDetailQuery,
  useGetPatientReferralsQuery,
  useGetPatientProfileQuery,
  useUpdatePatientProfileMutation,
  useGetPatientMedicalHistoryQuery,
  useUpdatePatientMedicalHistoryMutation,
  useGetPatientAppointmentsQuery,
  useBookAppointmentMutation,
  useGetPractitionersQuery,
  useGetDoctorsQuery,
  useRequestConsultationMutation,
  useGetPatientConsultationsQuery,
  useGetPatientConsultationDetailQuery,
  useCancelConsultationMutation,
} = patientApiSlice;

