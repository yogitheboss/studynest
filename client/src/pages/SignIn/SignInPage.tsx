import { Link, Navigate } from "react-router-dom";

import { AuthShell, GoogleAuthButton, useSession } from "@/features/Auth";

export const SignInPage = () => {
  const { data: session, isPending } = useSession();

  // Already signed in — send to the app.
  if (!isPending && session) {
    return <Navigate to="/" replace />;
  }

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to your info_hub account to continue."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            to="/signup"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign up
          </Link>
        </>
      }
    >
      <GoogleAuthButton label="Continue with Google" callbackURL="/" />
    </AuthShell>
  );
};
