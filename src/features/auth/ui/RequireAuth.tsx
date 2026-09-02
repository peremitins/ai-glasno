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
    return <Navigate replace state={{ from: location }} to="/auth" />;
  }

  return children;
}
