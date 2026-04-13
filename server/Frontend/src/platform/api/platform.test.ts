import { describe, expect, it } from "vitest";
import { buildPlatformApiKeyStats, resolveExternalApiBaseUrl } from "./platform";

describe("platform api helpers", () => {
  it("builds the external api base url from the current origin", () => {
    expect(resolveExternalApiBaseUrl("https://platform.nerior.store/")).toBe(
      "https://platform.nerior.store/api/v1/external",
    );
  });

  it("aggregates api key statistics", () => {
    const stats = buildPlatformApiKeyStats([
      {
        id: "1",
        publicId: "pub_1",
        name: "Primary",
        permission: "run",
        machineIds: ["m1"],
        allowedTemplateKeys: ["system:diag"],
        usageLimit: null,
        usesCount: 12,
        expiresAt: null,
        lastUsedAt: "2026-04-13T09:00:00.000Z",
        lastUsedIp: "127.0.0.1",
        createdAt: "2026-04-01T00:00:00.000Z",
        revokedAt: null,
        isActive: true,
      },
      {
        id: "2",
        publicId: "pub_2",
        name: "Read Only",
        permission: "read",
        machineIds: ["m2"],
        allowedTemplateKeys: [],
        usageLimit: null,
        usesCount: 3,
        expiresAt: "2026-05-01T00:00:00.000Z",
        lastUsedAt: "2026-04-12T08:00:00.000Z",
        lastUsedIp: null,
        createdAt: "2026-04-02T00:00:00.000Z",
        revokedAt: "2026-04-10T00:00:00.000Z",
        isActive: false,
      },
    ]);

    expect(stats.total).toBe(2);
    expect(stats.active).toBe(1);
    expect(stats.runEnabled).toBe(1);
    expect(stats.totalUses).toBe(15);
    expect(stats.expiring).toBe(1);
    expect(stats.mostUsed[0]?.name).toBe("Primary");
    expect(stats.mostRecent[0]?.name).toBe("Primary");
  });
});
