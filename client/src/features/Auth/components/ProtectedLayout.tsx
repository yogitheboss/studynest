import { useCallback } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { AppLayout } from "@/components/app-layout";
import { useSession, signOut } from "../lib/auth-client";

/**
 * Route guard + authenticated app shell. Resolves the session, redirects
 * unauthenticated users to /signin, and otherwise renders the shared
 * presentational layout with the current user.
 */
export const ProtectedLayout = () => {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate("/signin", { replace: true });
  }, [navigate]);

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/signin" replace />;
  }

  return <AppLayout user={session.user} onSignOut={handleSignOut} />;
};
