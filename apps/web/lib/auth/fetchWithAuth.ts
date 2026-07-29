/**
 * Wraps fetch for authenticated client-side calls: on a 401 (access token expired),
 * tries once to refresh via the refresh-token cookie, then retries. If the refresh
 * also fails, sends the user back to /login rather than looping.
 */
export async function fetchWithAuth(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, { ...init, credentials: "include" });
  if (response.status !== 401) return response;

  const refreshResponse = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
  });

  if (!refreshResponse.ok) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return response;
  }

  return fetch(input, { ...init, credentials: "include" });
}
