import { readCookie } from "./cookies";
import { resolveHostApp } from "../app/platform-host";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "/api/v1"
).replace(/\/$/, "");
const CSRF_COOKIE_NAME = import.meta.env.VITE_CSRF_COOKIE_NAME ?? "crossplat_csrf";
const API_CSRF_COOKIE_NAME = import.meta.env.VITE_API_CSRF_COOKIE_NAME ?? "nerior_api_csrf";
const CSRF_HEADER_NAME = import.meta.env.VITE_CSRF_HEADER_NAME ?? "X-CSRF-Token";

function resolveCsrfCookieName(): string {
  if (typeof window === "undefined") {
    return CSRF_COOKIE_NAME;
  }

  return resolveHostApp(window.location.hostname) === "api"
    ? API_CSRF_COOKIE_NAME
    : CSRF_COOKIE_NAME;
}

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
    const csrfToken = readCookie(resolveCsrfCookieName());
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
