import {
  createApi,
  fetchBaseQuery,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

import { appendCsrfHeader } from "./csrf";

export type ApiError = {
  code: string;
  message: string;
  status: number | string;
};

const tagTypes = [
  "Dashboard",
  "Profile",
  "Question",
  "Report",
  "Session",
] as const;

function getCurrentOrigin() {
  if (typeof window === "undefined") {
    return "http://localhost";
  }

  return window.location.origin;
}

export function normalizeApiBaseUrl(
  baseUrl: string,
  origin = getCurrentOrigin(),
) {
  return new URL(baseUrl, origin).toString().replace(/\/$/, "");
}

export function resolveSameOriginApiUrl(
  path: string,
  origin = getCurrentOrigin(),
) {
  return new URL(`/api/${path.replace(/^\/+/, "")}`, origin).toString();
}

export const API_BASE_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL ?? "/api",
);

export function toApiError(error: FetchBaseQueryError): ApiError {
  if (typeof error.data === "object" && error.data !== null) {
    const data = error.data as Partial<ApiError>;

    if (typeof data.code === "string" && typeof data.message === "string") {
      return {
        code: data.code,
        message: data.message,
        status: error.status,
      };
    }
  }

  return {
    code: "unexpected_error",
    message: "Не удалось выполнить запрос. Попробуйте ещё раз.",
    status: error.status,
  };
}

export function getApiErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "message" in error) {
    const { message } = error as { message?: unknown };

    if (typeof message === "string") {
      return message;
    }
  }

  if (typeof error === "object" && error !== null && "data" in error) {
    const { data } = error as { data?: unknown };

    if (
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string"
    ) {
      return data.message;
    }
  }

  return "Не удалось загрузить данные. Попробуйте ещё раз.";
}

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    credentials: "include",
    prepareHeaders: appendCsrfHeader,
  }),
  tagTypes,
  endpoints: () => ({}),
});
