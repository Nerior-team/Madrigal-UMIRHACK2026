import { readCookie } from "./cookies";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "/api/v1"
).replace(/\/$/, "");
const CSRF_COOKIE_NAME = import.meta.env.VITE_CSRF_COOKIE_NAME ?? "predict_mv_csrf";
const CSRF_HEADER_NAME = import.meta.env.VITE_CSRF_HEADER_NAME ?? "X-CSRF-Token";

export class ApiError extends Error {
  status: number;
  body: string;

  constructor(status: number, body: string) {
    super(body || `API request failed: ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

function resolveMethod(init?: RequestInit): string {
  if (init?.method) return init.method.toUpperCase();
  return init?.body === undefined ? "GET" : "POST";
}

function shouldAttachJsonContentType(body: BodyInit | null | undefined): boolean {
  return body !== undefined && body !== null && !(body instanceof FormData);
}

function isMutationMethod(method: string): boolean {
  return method !== "GET" && method !== "HEAD";
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const method = resolveMethod(init);
  const headers = new Headers(init.headers ?? {});

  if (!headers.has("Content-Type") && shouldAttachJsonContentType(init.body)) {
    headers.set("Content-Type", "application/json");
  }

  if (isMutationMethod(method) && !headers.has(CSRF_HEADER_NAME)) {
    const csrfToken = readCookie(CSRF_COOKIE_NAME);
    if (csrfToken) {
      headers.set(CSRF_HEADER_NAME, csrfToken);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    method,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(response.status, message || `API request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
