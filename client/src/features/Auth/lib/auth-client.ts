import { createAuthClient } from "better-auth/react";

/**
 * Single Better Auth client for the app. Points at the auth server origin so
 * requests are sent with credentials (the session cookie is host-scoped on
 * localhost, so it is shared across ports during local development).
 */
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_AUTH_BASE_URL ?? "http://localhost:3000",
});

export const { signIn, signOut, useSession } = authClient;

/** Authenticated user shape exposed by the session. */
export type SessionUser = (typeof authClient.$Infer.Session)["user"];
