import { baseApi, toApiError } from "@/shared/api/baseApi";

import { normalizeInterviewWorkspace } from "./interviewTransport";

import {
  interviewSessionSchema,
  interviewSessionsSchema,
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
      transformResponse: normalizeInterviewWorkspace,
      transformErrorResponse: toApiError,
      providesTags: (_result, _error, sessionId) => [
        { type: "Session", id: sessionId },
      ],
    }),
    saveAnswer: builder.mutation<InterviewWorkspace, SaveAnswerRequest>({
      query: ({ sessionId, ...body }) => ({
        url: `sessions/${sessionId}/answer`,
        method: "POST",
        body,
      }),
      transformResponse: normalizeInterviewWorkspace,
      transformErrorResponse: toApiError,
      invalidatesTags: ["Session"],
    }),
    nextQuestion: builder.mutation<InterviewWorkspace, NextQuestionRequest>({
      query: ({ sessionId, ...body }) => ({
        url: `sessions/${sessionId}/next`,
        method: "POST",
        body,
      }),
      transformResponse: normalizeInterviewWorkspace,
      transformErrorResponse: toApiError,
      invalidatesTags: ["Session"],
    }),
    completeSession: builder.mutation<InterviewWorkspace, string>({
      query: (sessionId) => ({
        url: `sessions/${sessionId}/finish`,
        method: "POST",
      }),
      transformResponse: normalizeInterviewWorkspace,
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
