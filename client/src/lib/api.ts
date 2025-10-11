import { getAuthToken } from "./auth";

export async function apiClient(url: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok && response.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }

  return response;
}
