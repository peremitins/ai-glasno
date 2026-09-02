import { baseApi, toApiError } from "@/shared/api/baseApi";

import type { DashboardOverview } from "../model/types";

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboard: builder.query<DashboardOverview, void>({
      query: () => "dashboard",
      providesTags: ["Dashboard"],
      transformErrorResponse: toApiError,
    }),
  }),
});

export const { useGetDashboardQuery } = dashboardApi;
