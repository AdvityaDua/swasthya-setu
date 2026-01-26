import { apiSlice } from './index';

export const userApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: "auth/login/",
        method: "POST",
        body: credentials,
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: "auth/logout/",
        method: "POST",
        credentials: "include",
      }),
    }),
    refresh: builder.mutation({
      query: () => ({
        url: "auth/refresh-token/",
        method: "POST",
        credentials: "include",
      }),
    }),
    register: builder.mutation({
      query: (data) => ({
        url: "auth/register/",
        method: "POST",
        body: data
      })
    }),
  }),
});

export const { useLoginMutation, useLogoutMutation, useRefreshMutation, useRegisterMutation } = userApiSlice;
