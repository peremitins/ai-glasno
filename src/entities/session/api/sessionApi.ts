import { baseApi, toApiError } from "@/shared/api/baseApi";

import {
  interviewSessionSchema,
  interviewSessionsSchema,
  interviewWorkspaceSchema,
  type InterviewSession,
  type InterviewWorkspace,
  type NextQuestionRequest,
  type SaveAnswerRequest,
  type SessionDraft,
} from "../model/types";

export const sessionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSessions: builder.query<InterviewSession[], void>({
      query: () => "sessions",
      transformResponse: (response: unknown) =>
        interviewSessionsSchema.parse(response),
      transformErrorResponse: toApiError,
      providesTags: ["Session"],
    }),
    createSession: builder.mutation<InterviewSession, SessionDraft>({
      query: (draft) => ({
        url: "sessions",
        method: "POST",
        body: draft,
      }),
      transformResponse: (response: unknown) =>
        interviewSessionSchema.parse(response),
      transformErrorResponse: toApiError,
      invalidatesTags: ["Session", "Dashboard"],
    }),
    getInterviewWorkspace: builder.query<InterviewWorkspace, string>({
      query: (sessionId) => `sessions/${sessionId}`,
      transformResponse: (response: unknown) =>
        interviewWorkspaceSchema.parse(response),
      transformErrorResponse: toApiError,
      providesTags: (_result, _error, sessionId) => [
        { type: "Session", id: sessionId },
      ],
    }),
    saveAnswer: builder.mutation<InterviewWorkspace, SaveAnswerRequest>({
      query: ({ turnId, ...body }) => ({
        url: `sessions/turns/${turnId}/answer`,
        method: "POST",
        body,
      }),
      transformResponse: (response: unknown) =>
        interviewWorkspaceSchema.parse(response),
      transformErrorResponse: toApiError,
      invalidatesTags: ["Session"],
    }),
    nextQuestion: builder.mutation<InterviewWorkspace, NextQuestionRequest>({
      query: ({ turnId }) => ({
        url: `sessions/turns/${turnId}/next`,
        method: "POST",
      }),
      transformResponse: (response: unknown) =>
        interviewWorkspaceSchema.parse(response),
      transformErrorResponse: toApiError,
      invalidatesTags: ["Session"],
    }),
    completeSession: builder.mutation<InterviewWorkspace, string>({
      query: (sessionId) => ({
        url: `sessions/${sessionId}/complete`,
        method: "POST",
      }),
      transformResponse: (response: unknown) =>
        interviewWorkspaceSchema.parse(response),
      transformErrorResponse: toApiError,
      invalidatesTags: (_result, _error, sessionId) => [
        { type: "Session", id: sessionId },
        "Dashboard",
      ],
    }),
  }),
});

export const {
  useCompleteSessionMutation,
  useCreateSessionMutation,
  useGetInterviewWorkspaceQuery,
  useGetSessionsQuery,
  useNextQuestionMutation,
  useSaveAnswerMutation,
} = sessionApi;
