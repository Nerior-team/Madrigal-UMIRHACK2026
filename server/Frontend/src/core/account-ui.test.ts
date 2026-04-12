import { describe, expect, it } from "vitest";

import { getRetentionOptions, validatePasswordPolicy } from "./account-ui";

describe("account-ui", () => {
  it("returns retention options in expected order", () => {
    expect(getRetentionOptions().map((item) => item.value)).toEqual([
      "none",
      "week",
      "month",
      "three_months",
      "six_months",
      "year",
      "forever",
    ]);
  });

  it("validates password policy", () => {
    expect(validatePasswordPolicy("short")).toContain("Не менее 12 символов.");
    expect(validatePasswordPolicy("NoSpecials123")).toContain(
      "Добавьте специальный символ.",
    );
    expect(validatePasswordPolicy("ValidPassword!123")).toEqual([]);
  });
});
