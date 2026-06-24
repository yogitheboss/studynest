import { Link, Navigate } from "react-router-dom";

import { AuthShell, GoogleAuthButton, useSession } from "@/features/Auth";

export const SignUpPage = () => {
  const { data: session, isPending } = useSession();

  // Already signed in — send to the app.
  if (!isPending && session) {
    return <Navigate to="/" replace />;
  }

  return (
    <AuthShell
      title="Create your account"
      description="Get started with StudyNest in seconds."
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/signin"
            className="text-primary font-medium underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <GoogleAuthButton label="Sign up with Google" callbackURL="/" />
    </AuthShell>
  );
};
