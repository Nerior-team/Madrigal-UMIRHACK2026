import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch, ApiError } from "./http";

describe("apiFetch", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    document.cookie = "predict_mv_csrf=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  });

  it("sends credentialed JSON requests with CSRF for mutations", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    document.cookie = "predict_mv_csrf=csrf-token-1; path=/";

    await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "a@b.c" }),
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);

    expect(url).toBe("/api/v1/auth/login");
    expect(init.credentials).toBe("include");
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(headers.get("X-CSRF-Token")).toBe("csrf-token-1");
  });

  it("raises ApiError with status and backend message", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("Unauthorized", { status: 401 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch("/auth/me")).rejects.toMatchObject({
      status: 401,
      message: "Unauthorized",
    } satisfies Partial<ApiError>);
  });
});
