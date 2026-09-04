import { baseApi, toApiError } from "@/shared/api/baseApi";

import {
  interviewSessionSchema,
  interviewSessionsSchema,
  type InterviewSession,
  type SessionDraft,
} from "../model/types";

export const sessionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSessions: builder.query<InterviewSession[], void>({
      query: () => "sessions",
      transformResponse: (response: unknown) => interviewSessionsSchema.parse(response),
      transformErrorResponse: toApiError,
      providesTags: ["Session"],
    }),
    createSession: builder.mutation<InterviewSession, SessionDraft>({
      query: (draft) => ({
        url: "sessions",
        method: "POST",
        body: draft,
      }),
      transformResponse: (response: unknown) => interviewSessionSchema.parse(response),
      transformErrorResponse: toApiError,
      invalidatesTags: ["Session", "Dashboard"],
    }),
  }),
});

export const { useCreateSessionMutation, useGetSessionsQuery } = sessionApi;
