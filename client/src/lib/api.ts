/** API origin. Mirrors the auth client's fallback for local development. */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_AUTH_BASE_URL ??
  "http://localhost:3000";

/**
 * Thin fetch wrapper that always sends the session cookie and turns non-2xx
 * responses into Errors carrying the server's `error` message when present.
 */
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    ...init,
  });

  if (!response.ok) {
    const message = await response
      .json()
      .then((data: { error?: string }) => data.error)
      .catch(() => null);
    throw new Error(message ?? `Request failed (${response.status}).`);
  }

  // 204 No Content has no body to parse.
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
