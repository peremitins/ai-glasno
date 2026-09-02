import { setUser } from "@/features/auth/model/authSlice";
import { baseApi, toApiError } from "@/shared/api/baseApi";

import type { AuthUser } from "../model/types";

type StartEmailLoginResponse = {
  devCode?: string;
  ok: true;
};

type VerifyEmailLoginRequest = {
  code: string;
  email: string;
};

type VerifyEmailLoginResponse = {
  user: AuthUser;
};

type UpdateProfileRequest = {
  displayName: string;
};

type UpdateProfileResponse = {
  user: AuthUser;
};

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    startEmailLogin: builder.mutation<
      StartEmailLoginResponse,
      { email: string }
    >({
      query: (body) => ({
        url: "auth/email/start",
        method: "POST",
        body,
      }),
      transformErrorResponse: toApiError,
    }),
    verifyEmailLogin: builder.mutation<
      VerifyEmailLoginResponse,
      VerifyEmailLoginRequest
    >({
      query: (body) => ({
        url: "auth/email/verify",
        method: "POST",
        body,
      }),
      transformErrorResponse: toApiError,
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(setUser(data.user));
      },
    }),
    getProfile: builder.query<AuthUser, void>({
      query: () => "profile",
      providesTags: ["Profile"],
      transformErrorResponse: toApiError,
    }),
    updateProfile: builder.mutation<
      UpdateProfileResponse,
      UpdateProfileRequest
    >({
      query: (body) => ({
        url: "profile",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Profile"],
      transformErrorResponse: toApiError,
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(setUser(data.user));
      },
    }),
  }),
});

export const {
  useGetProfileQuery,
  useStartEmailLoginMutation,
  useUpdateProfileMutation,
  useVerifyEmailLoginMutation,
} = authApi;
