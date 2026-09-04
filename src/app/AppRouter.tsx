import { Route, Routes } from "react-router";

import { AppShell } from "@/app/layouts/AppShell";
import { RequireAuth } from "@/features/auth/ui/RequireAuth";
import { AuthPage } from "@/pages/AuthPage";
import { HomePage } from "@/pages/HomePage";
import { HistoryPage } from "@/pages/HistoryPage";
import { InterviewPage } from "@/pages/InterviewPage";
import { NewInterviewPage } from "@/pages/NewInterviewPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { ProfilePage } from "@/pages/ProfilePage";

function AppRouter() {
  return (
    <Routes>
      <Route path="auth" element={<AuthPage />} />
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="interview/new" element={<NewInterviewPage />} />
        <Route path="interview/:id" element={<InterviewPage />} />
        <Route
          path="profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRouter;
