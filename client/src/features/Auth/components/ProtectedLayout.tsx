import { useCallback, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { AppLayout } from "@/components/app-layout";
import { useSession, signOut } from "../lib/auth-client";
import { useAuthStore } from "../stores/auth-store";

/**
 * Route guard + authenticated app shell. Resolves the session, redirects
 * unauthenticated users to /signin, and otherwise renders the shared
 * presentational layout with the current user.
 */
export const ProtectedLayout = () => {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  // Mirror the resolved session into the global auth store.
  useEffect(() => {
    setUser(session?.user ?? null);
  }, [session, setUser]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setUser(null);
    navigate("/signin", { replace: true });
  }, [navigate, setUser]);

  if (isPending) {
    return (
      <div className="bg-background flex min-h-svh items-center justify-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/signin" replace />;
  }

  return <AppLayout user={session.user} onSignOut={handleSignOut} />;
};
