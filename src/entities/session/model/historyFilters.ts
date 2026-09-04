import type { SessionStatus } from "./types";

export type SessionStatusFilter = SessionStatus | "all";

export function getSessionStatusFilter(value: string | null): SessionStatusFilter {
  return value === "active" || value === "completed" ? value : "all";
}

export function setSessionStatusFilter(
  searchParams: URLSearchParams,
  status: SessionStatusFilter,
) {
  const nextSearchParams = new URLSearchParams(searchParams);

  if (status === "all") {
    nextSearchParams.delete("status");
  } else {
    nextSearchParams.set("status", status);
  }

  return nextSearchParams;
}
