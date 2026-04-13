import { describe, expect, it } from "vitest";
import { resolveHostApp } from "./platform-host";

describe("resolveHostApp", () => {
  it("maps the main public site host", () => {
    expect(resolveHostApp("nerior.store")).toBe("nerior-site");
  });

  it("maps the product host", () => {
    expect(resolveHostApp("crossplat.nerior.store")).toBe("crossplat");
  });

  it("maps the docs host", () => {
    expect(resolveHostApp("docs.nerior.store")).toBe("docs");
  });

  it("maps the community host", () => {
    expect(resolveHostApp("community.nerior.store")).toBe("community");
  });

  it("maps the help host", () => {
    expect(resolveHostApp("help.nerior.store")).toBe("help");
  });

  it("maps the api host", () => {
    expect(resolveHostApp("api.nerior.store")).toBe("api");
  });

  it("keeps legacy platform host routed into the api cabinet", () => {
    expect(resolveHostApp("platform.nerior.store")).toBe("api");
  });

  it("maps unavailable product hosts", () => {
    expect(resolveHostApp("smart-planner.nerior.store")).toBe("smart-planner");
    expect(resolveHostApp("karpik.nerior.store")).toBe("karpik");
  });

  it("defaults localhost to crossplat for local development", () => {
    expect(resolveHostApp("localhost")).toBe("crossplat");
  });
});
