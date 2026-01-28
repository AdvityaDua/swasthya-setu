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
      query: ({ consultation_id, scheduled_time }) => ({
        url: `doctor/consultations/${consultation_id}/schedule/`,
        method: "POST",
        body: { scheduled_time },
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
  }),
});

export const {
  useGetDoctorConsultationsQuery,
  useGetDoctorConsultationDetailQuery,
  useScheduleConsultationMutation,
  useRejectConsultationMutation,
  useRescheduleConsultationMutation,
} = doctorApiSlice;
