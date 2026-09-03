import { baseApi, toApiError } from "@/shared/api/baseApi";

import { interviewSessionsSchema, type InterviewSession } from "../model/types";

export const sessionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSessions: builder.query<InterviewSession[], void>({
      query: () => "sessions",
      transformResponse: (response: unknown) => interviewSessionsSchema.parse(response),
      transformErrorResponse: toApiError,
      providesTags: ["Session"],
    }),
  }),
});

export const { useGetSessionsQuery } = sessionApi;
