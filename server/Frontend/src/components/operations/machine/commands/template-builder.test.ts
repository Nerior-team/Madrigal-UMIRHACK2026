import { describe, expect, it } from "vitest";

import {
  buildCommandPatternFromBase,
  buildGeneratedParameterKey,
  deriveCommandBaseFromPattern,
} from "./template-builder";

describe("template-builder", () => {
  it("builds stable generated parameter keys", () => {
    expect(buildGeneratedParameterKey(0)).toBe("param_1");
    expect(buildGeneratedParameterKey(2)).toBe("param_3");
  });

  it("builds a backend command pattern from command and parameters", () => {
    expect(
      buildCommandPatternFromBase("docker compose", ["param_1", "param_2"]),
    ).toBe("docker compose {param_1} {param_2}");
  });

  it("derives a command base from an existing pattern", () => {
    expect(
      deriveCommandBaseFromPattern("docker compose {action} --profile core {service}"),
    ).toBe("docker compose --profile core");
  });
});
