import { create } from "zustand";

import type { SessionUser } from "../lib/auth-client";

interface AuthState {
  /** Current authenticated user, or null when signed out / unresolved. */
  user: SessionUser | null;
  setUser: (user: SessionUser | null) => void;
  clearUser: () => void;
}

/**
 * Global auth store. Better Auth's `useSession` remains the source of truth for
 * the session lifecycle; this store mirrors the resolved user so any component
 * can read it without prop drilling or re-running the session hook.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
