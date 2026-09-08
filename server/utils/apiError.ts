export const API_ERROR_CODES = [
  "E_VALIDATION",
  "E_AUTH",
  "E_FORBIDDEN",
  "E_RATE",
  "E_NOT_FOUND",
  "E_CONFLICT",
  "E_UPSTREAM",
  "E_UNKNOWN",
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

const statusByCode: Record<ApiErrorCode, number> = {
  E_VALIDATION: 400,
  E_AUTH: 401,
  E_FORBIDDEN: 403,
  E_RATE: 429,
  E_NOT_FOUND: 404,
  E_CONFLICT: 409,
  E_UPSTREAM: 502,
  E_UNKNOWN: 500,
};

export class ApiError extends Error {
  readonly statusCode: number;
  readonly data: { code: ApiErrorCode; message: string; details?: unknown };

  constructor(code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusByCode[code];
    this.data = { code, message, details };
  }
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  details?: unknown,
) {
  return new ApiError(code, message, details);
}
