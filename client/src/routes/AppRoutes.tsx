import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedLayout } from "@/features/Auth";
import { DashboardPage } from "@/pages/Dashboard/DashboardPage";
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
        <Route path="/" element={<DashboardPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
