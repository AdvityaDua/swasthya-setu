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
      pollingInterval: 15000,
      keepUnusedDataFor: 0,
    }),
  }),
});

export const { useGetPatientTestsQuery, useGetPatientTestDetailQuery, useGetPatientReferralsQuery, useGetPatientProfileQuery } = patientApiSlice;

