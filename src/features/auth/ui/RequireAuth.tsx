import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";

import { useAppSelector } from "@/app/hooks";

type RequireAuthProps = {
  children: ReactNode;
};

export function RequireAuth({ children }: RequireAuthProps) {
  const user = useAppSelector((state) => state.auth.user);
  const location = useLocation();

  if (!user) {
    const nextPath = `${location.pathname}${location.search}${location.hash}`;

    return (
      <Navigate replace to={`/auth?next=${encodeURIComponent(nextPath)}`} />
    );
  }

  return children;
}
