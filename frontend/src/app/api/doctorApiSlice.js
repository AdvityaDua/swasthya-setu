import { apiSlice } from './index';

export const doctorApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDoctorConsultations: builder.query({
      query: (status) => {
        const params = new URLSearchParams();
        if (status) {
          params.append('status', status);
        }
        return `doctor/consultations/?${params.toString()}`;
      },
      providesTags: ["DoctorConsultations"],
      keepUnusedDataFor: 0,
    }),
    getDoctorConsultationDetail: builder.query({
      query: (consultation_id) => `doctor/consultations/${consultation_id}/`,
      keepUnusedDataFor: 0,
    }),
    scheduleConsultation: builder.mutation({
      query: ({ consultation_id, scheduled_time, meet_link, calendar_event_id }) => ({
        url: `doctor/consultations/${consultation_id}/schedule/`,
        method: "POST",
        body: { scheduled_time, meet_link, calendar_event_id },
      }),
      invalidatesTags: ["DoctorConsultations"],
    }),
    rejectConsultation: builder.mutation({
      query: ({ consultation_id, reason }) => ({
        url: `doctor/consultations/${consultation_id}/reject/`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["DoctorConsultations"],
    }),
    rescheduleConsultation: builder.mutation({
      query: ({ consultation_id, scheduled_time }) => ({
        url: `doctor/consultations/${consultation_id}/reschedule/`,
        method: "POST",
        body: { scheduled_time },
      }),
      invalidatesTags: ["DoctorConsultations"],
    }),
    cancelDoctorConsultation: builder.mutation({
      query: ({ consultation_id, reason }) => ({
        url: `doctor/consultations/${consultation_id}/cancel/`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["DoctorConsultations"],
    }),
    getDoctorDashboardStats: builder.query({
      query: () => "doctor/dashboard/stats/",
      keepUnusedDataFor: 0,
    }),
    getDoctorReferrals: builder.query({
      query: () => "doctor/referrals/",
      providesTags: ["DoctorReferrals"],
      keepUnusedDataFor: 0,
    }),
    getDoctorCaseDetail: builder.query({
      query: (test_id) => `doctor/cases/${test_id}/`,
      keepUnusedDataFor: 0,
    }),
    submitDoctorReview: builder.mutation({
      query: ({ referral_id, decision, notes }) => ({
        url: `doctor/referrals/${referral_id}/review/`,
        method: "POST",
        body: { decision, notes },
      }),
      invalidatesTags: ["DoctorReferrals", "DoctorDashboardStats"],
    }),
    closeDoctorReferral: builder.mutation({
      query: (referral_id) => ({
        url: `doctor/referrals/${referral_id}/close/`,
        method: "POST",
      }),
      invalidatesTags: ["DoctorReferrals", "DoctorDashboardStats"],
    }),
    createAndScheduleConsultation: builder.mutation({
      query: (data) => ({
        url: `doctor/consultations/create-schedule/`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["DoctorConsultations"],
    }),
    getDoctorProfile: builder.query({
      query: () => "doctor/me/",
      providesTags: ["DoctorProfile"],
      keepUnusedDataFor: 0,
    }),
    updateDoctorProfile: builder.mutation({
      query: (data) => ({
        url: `doctor/me/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["DoctorProfile"],
    }),
    getDoctorReviewedCases: builder.query({
      query: () => "doctor/reviewed/",
      keepUnusedDataFor: 0,
    }),
  }),
});

export const {
  useGetDoctorConsultationsQuery,
  useGetDoctorConsultationDetailQuery,
  useScheduleConsultationMutation,
  useRejectConsultationMutation,
  useRescheduleConsultationMutation,
  useCancelDoctorConsultationMutation,
  useGetDoctorDashboardStatsQuery,
  useGetDoctorReferralsQuery,
  useGetDoctorCaseDetailQuery,
  useSubmitDoctorReviewMutation,
  useCloseDoctorReferralMutation,
  useCreateAndScheduleConsultationMutation,
  useGetDoctorProfileQuery,
  useUpdateDoctorProfileMutation,
  useGetDoctorReviewedCasesQuery,
} = doctorApiSlice;
