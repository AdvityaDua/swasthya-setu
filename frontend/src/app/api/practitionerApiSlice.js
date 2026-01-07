import { apiSlice } from './index';

export const practitionerApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    searchPatient: builder.query({
      query: ({ phone, abhi_id }) => {
        if (phone) return `practitioner/patient-search/?phone=${phone}`;
        if (abhi_id) return `practitioner/patient-search/?abhi_id=${abhi_id}`;
        return 'practitioner/patient-search/';
      },
      keepUnusedDataFor: 0,
    }),
    createDiagnosticTest: builder.mutation({
      query: (body) => ({
        url: "practitioner/tests/create/",
        method: "POST",
        body,
      }),
    }),
    uploadTestImage: builder.mutation({
      query: ({ test_id, formData }) => ({
        url: `practitioner/tests/${test_id}/upload/`,
        method: "POST",
        body: formData,
      }),
    }),
    addClinicalContext: builder.mutation({
      query: ({ test_id, body }) => ({
        url: `practitioner/tests/${test_id}/context/`,
        method: "POST",
        body,
      }),
    }),
    runAIInference: builder.mutation({
      query: (test_id) => ({
        url: `practitioner/tests/${test_id}/run-ai/`,
        method: "POST",
      }),
    }),
    referToDoctor: builder.mutation({
      query: ({ test_id, body }) => ({
        url: `practitioner/tests/${test_id}/refer/`,
        method: "POST",
        body,
      }),
    }),
    getPractitionerActiveTests: builder.query({
      query: () => "practitioner/tests/active/",
      pollingInterval: 15000,
      keepUnusedDataFor: 0,
    }),
    getPractitionerProfile: builder.query({
      query: () => "practitioner/me/",
      pollingInterval: 15000,
      keepUnusedDataFor: 0,
    }),
  }),
});

export const {
  useSearchPatientQuery,
  useCreateDiagnosticTestMutation,
  useUploadTestImageMutation,
  useAddClinicalContextMutation,
  useRunAIInferenceMutation,
  useReferToDoctorMutation,
  useGetPractitionerActiveTestsQuery,
  useGetPractitionerProfileQuery,
} = practitionerApiSlice;

