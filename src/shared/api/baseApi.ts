import {
  createApi,
  fetchBaseQuery,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

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

function getDefaultApiBaseUrl() {
  if (typeof window === "undefined") {
    return "http://localhost/api/";
  }

  return new URL("/api/", window.location.origin).toString();
}

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? getDefaultApiBaseUrl()
).replace(/\/$/, "");

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

  return "Не удалось загрузить данные. Попробуйте ещё раз.";
}

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL }),
  tagTypes,
  endpoints: () => ({}),
});
