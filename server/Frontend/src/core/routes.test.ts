import { describe, expect, it } from "vitest";

import {
  addMachinePath,
  logsPath,
  machinePath,
  machineResultPath,
  machineTaskLogsPath,
  profilePath,
  profileApiKeysPath,
  resolveAppRoute,
  resultPath,
  taskLogsPath,
  taskPath,
  workspacePath,
} from "./routes";

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

  it("resolves the dashboard route", () => {
    expect(resolveAppRoute("/dashboard")).toEqual({
      section: "workspace",
      workspaceTab: "home",
    });
  });

  it("resolves add-machine route", () => {
    expect(resolveAppRoute("/machines/add")).toEqual({
      section: "workspace",
      workspaceTab: "machines",
      isAddMachine: true,
    });
  });

  it("resolves machine detail routes", () => {
    expect(resolveAppRoute("/machines/machine-1")).toEqual({
      section: "workspace",
      workspaceTab: "machines",
      machineId: "machine-1",
      machineTab: "dashboard",
    });

    expect(resolveAppRoute("/machines/machine-1/results")).toEqual({
      section: "workspace",
      workspaceTab: "machines",
      machineId: "machine-1",
      machineTab: "results",
    });
  });

  it("resolves machine task logs modal route", () => {
    expect(resolveAppRoute("/machines/machine-1/logs/task-9")).toEqual({
      section: "workspace",
      workspaceTab: "machines",
      machineId: "machine-1",
      machineTab: "dashboard",
      modal: { kind: "machine-task-logs", taskId: "task-9" },
    });
  });

  it("resolves task detail and task logs routes", () => {
    expect(resolveAppRoute("/tasks/task-9")).toEqual({
      section: "workspace",
      workspaceTab: "tasks",
      taskId: "task-9",
    });

    expect(resolveAppRoute("/tasks/task-9/logs")).toEqual({
      section: "workspace",
      workspaceTab: "tasks",
      taskId: "task-9",
      modal: { kind: "task-logs", taskId: "task-9" },
    });
  });

  it("resolves result detail route", () => {
    expect(resolveAppRoute("/results/result-4")).toEqual({
      section: "workspace",
      workspaceTab: "results",
      resultId: "result-4",
      modal: { kind: "result-detail", resultId: "result-4" },
    });
  });

  it("resolves profile routes", () => {
    expect(resolveAppRoute("/profile")).toEqual({
      section: "workspace",
      workspaceTab: "profile",
      profileSection: "general",
    });
    expect(resolveAppRoute("/profile/security")).toEqual({
      section: "workspace",
      workspaceTab: "profile",
      profileSection: "security",
    });
    expect(resolveAppRoute("/profile/sessions")).toEqual({
      section: "workspace",
      workspaceTab: "profile",
      profileSection: "sessions",
    });
    expect(resolveAppRoute("/profile/notifications")).toEqual({
      section: "workspace",
      workspaceTab: "profile",
      profileSection: "notifications",
    });
    expect(resolveAppRoute("/profile/api-keys")).toEqual({
      section: "workspace",
      workspaceTab: "profile",
      profileSection: "api-keys",
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
    expect(workspacePath("home")).toBe("/dashboard");
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

describe("secondary path helpers", () => {
  it("builds helper routes for modals and deep links", () => {
    expect(addMachinePath()).toBe("/machines/add");
    expect(taskPath("task-9")).toBe("/tasks/task-9");
    expect(taskLogsPath("task-9")).toBe("/tasks/task-9/logs");
    expect(resultPath("result-4")).toBe("/results/result-4");
    expect(machineTaskLogsPath("machine-1", "task-9")).toBe(
      "/machines/machine-1/logs/task-9",
    );
    expect(machineResultPath("machine-1", "result-4")).toBe(
      "/machines/machine-1/results/result-4",
    );
    expect(profilePath()).toBe("/profile");
    expect(profilePath("security")).toBe("/profile/security");
    expect(profilePath("sessions")).toBe("/profile/sessions");
    expect(profilePath("notifications")).toBe("/profile/notifications");
    expect(profileApiKeysPath()).toBe("/profile/api-keys");
  });
});

describe("logsPath", () => {
  it("builds logs urls with machine and task context", () => {
    expect(logsPath({ machineId: "machine-1", taskId: "task-9" })).toBe(
      "/logs?machineId=machine-1&taskId=task-9",
    );
  });
});
