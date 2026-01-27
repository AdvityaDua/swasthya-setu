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
} = patientApiSlice;

