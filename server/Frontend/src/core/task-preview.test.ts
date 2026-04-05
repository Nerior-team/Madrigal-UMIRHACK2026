import { describe, expect, it } from "vitest";

import {
  buildTaskPreview,
  getTaskPreviewShellLabel,
  renderTaskCommand,
} from "./task-preview";

describe("renderTaskCommand", () => {
  it("renders command pattern with selected params", () => {
    expect(
      renderTaskCommand("docker compose {action} {target}", {
        action: "up",
        target: "--build -d",
      }),
    ).toBe("docker compose up --build -d");
  });
});

describe("buildTaskPreview", () => {
  it("adds sudo prefix only when explicitly enabled", () => {
    expect(
      buildTaskPreview({
        commandPattern: "docker compose {action}",
        params: { action: "up" },
        useSudo: true,
      }),
    ).toBe("sudo docker compose up");
  });

  it("returns command without sudo when checkbox is disabled", () => {
    expect(
      buildTaskPreview({
        commandPattern: "docker compose {action}",
        params: { action: "ps" },
        useSudo: false,
      }),
    ).toBe("docker compose ps");
  });
});

describe("getTaskPreviewShellLabel", () => {
  it("uses Bash for linux machines and Shell for windows machines", () => {
    expect(getTaskPreviewShellLabel("Linux")).toBe("Bash");
    expect(getTaskPreviewShellLabel("Windows 11")).toBe("Shell");
  });
});
