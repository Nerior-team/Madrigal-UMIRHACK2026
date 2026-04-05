import { describe, expect, it } from "vitest";

import { logsPath, machinePath, resolveAppRoute, workspacePath } from "./routes";

describe("resolveAppRoute", () => {
  it("resolves auth routes", () => {
    expect(resolveAppRoute("/login")).toEqual({
      section: "auth",
      authMode: "login",
    });
    expect(resolveAppRoute("/register")).toEqual({
      section: "auth",
      authMode: "register",
    });
  });

  it("resolves machine detail routes", () => {
    expect(resolveAppRoute("/machines/machine-1/results")).toEqual({
      section: "workspace",
      workspaceTab: "machines",
      machineId: "machine-1",
      machineTab: "results",
    });
  });

  it("resolves logs route context from search params", () => {
    expect(resolveAppRoute("/logs", "?machineId=machine-1&taskId=task-9")).toEqual({
      section: "workspace",
      workspaceTab: "logs",
      logMachineId: "machine-1",
      logTaskId: "task-9",
    });
  });
});

describe("workspacePath", () => {
  it("builds canonical workspace paths", () => {
    expect(workspacePath("machines")).toBe("/machines");
    expect(workspacePath("profile")).toBe("/profile");
  });
});

describe("machinePath", () => {
  it("builds canonical machine detail paths", () => {
    expect(machinePath("machine-1")).toBe("/machines/machine-1");
    expect(machinePath("machine-1", "logs")).toBe("/machines/machine-1/logs");
  });
});

describe("logsPath", () => {
  it("builds logs urls with machine and task context", () => {
    expect(logsPath({ machineId: "machine-1", taskId: "task-9" })).toBe(
      "/logs?machineId=machine-1&taskId=task-9",
    );
  });
});
