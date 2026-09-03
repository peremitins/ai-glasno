import { baseApi, toApiError } from "@/shared/api/baseApi";

import { dashboardOverviewSchema, type DashboardOverview } from "../model/types";

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboard: builder.query<DashboardOverview, void>({
      query: () => "dashboard",
      providesTags: ["Dashboard"],
      transformResponse: (response: unknown) => dashboardOverviewSchema.parse(response),
      transformErrorResponse: toApiError,
    }),
  }),
});

export const { useGetDashboardQuery } = dashboardApi;
