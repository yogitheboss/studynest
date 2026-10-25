import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedLayout } from "@/features/Auth";
import { JournalView, TodoView } from "@/features/Journal";
import { DashboardPage, UploadsView } from "@/pages/Dashboard/DashboardPage";
import { PlanPage } from "@/pages/Plan/PlanPage";
import { PublicCoursePage } from "@/pages/PublicCourse/PublicCoursePage";
import { SignInPage } from "@/pages/SignIn/SignInPage";
import { SignUpPage } from "@/pages/SignUp/SignUpPage";

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />

      {/* Public, no-auth course view (shared via link) */}
      <Route path="/c/:publicId" element={<PublicCoursePage />} />

      {/* Protected app shell */}
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Navigate to="/courses" replace />} />
        <Route path="/courses" element={<DashboardPage />} />
        <Route path="/plan" element={<PlanPage />} />
        <Route path="/journal" element={<JournalView />} />
        <Route path="/todos" element={<TodoView />} />
        <Route path="/todos/:noteId" element={<TodoView />} />
        <Route path="/uploads" element={<UploadsView />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
