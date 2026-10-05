/**
 * Tiny fetch wrapper for the GlimmoraNautica backend.
 *
 * - Reads NEXT_PUBLIC_API_BASE (default http://localhost:8000).
 * - Pulls the access token from localStorage (set by AuthContext on login).
 * - Returns parsed JSON, or throws an ApiError with the standard error envelope.
 *
 * Pages opt-in by importing wrappers from `lib/api/*.ts`. The voyage flow uses
 * `lib/voyage/voyageApiClient.ts` which has the same surface as the existing
 * mock so swapping is one line.
 */

const API_BASE =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE) ||
  "http://localhost:8000";

const TOKEN_KEY = "glimmora_token";

export class ApiError extends Error {
  status: number;
  code: string;
  detail?: unknown;
  constructor(status: number, code: string, message: string, detail?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.detail = detail;
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAccessToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export type FetchOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export async function api<T = unknown>(
  path: string,
  opts: FetchOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers || {}),
  };
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  // On the server (Next.js Server Components), forward the inbound request
  // cookies so the backend can authenticate via `glimmora_session`.
  if (typeof window === "undefined") {
    try {
      const { cookies } = await import("next/headers");
      const cookieHeader = cookies()
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");
      if (cookieHeader) headers["Cookie"] = cookieHeader;
    } catch {
      // running outside a request scope (e.g. during build) — no cookies
    }
  }

  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: opts.method || "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    credentials: "include",
    signal: opts.signal,
    cache: "no-store",
  });

  if (res.status === 204) return undefined as unknown as T;

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // non-JSON body
  }

  if (!res.ok) {
    const env = (data as any)?.error || {};
    throw new ApiError(
      res.status,
      env.code || "http_error",
      env.message || `HTTP ${res.status}`,
      env.detail
    );
  }

  return data as T;
}

export const API_BASE_URL = API_BASE;
