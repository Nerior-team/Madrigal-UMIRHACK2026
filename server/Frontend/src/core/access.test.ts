import { describe, expect, it } from "vitest";

import {
  buildAccessMetrics,
  getAccessRowCapabilities,
  getInviteStatusPresentation,
  sortAccessEntries,
  type AccessEntryLike,
  type InviteLike,
} from "./access";

function makeEntry(
  overrides: Partial<AccessEntryLike> = {},
): AccessEntryLike {
  return {
    id: "access-1",
    machineId: "machine-1",
    machineName: "Win 10",
    userId: "user-1",
    email: "user@example.com",
    role: "viewer",
    createdAt: "2026-04-11T10:00:00Z",
    revokedAt: null,
    isCreatorOwner: false,
    ...overrides,
  };
}

function makeInvite(overrides: Partial<InviteLike> = {}): InviteLike {
  return {
    id: "invite-1",
    machineId: "machine-1",
    machineName: "Win 10",
    email: "invite@example.com",
    role: "operator",
    status: "pending",
    expiresAt: "2026-04-12T10:00:00Z",
    ...overrides,
  };
}

describe("getAccessRowCapabilities", () => {
  it("does not allow admin to manage creator-owner or other admins", () => {
    const creatorOwner = getAccessRowCapabilities({
      actorRole: "admin",
      actorUserId: "admin-1",
      entry: makeEntry({
        userId: "owner-1",
        role: "owner",
        isCreatorOwner: true,
      }),
    });

    const peerAdmin = getAccessRowCapabilities({
      actorRole: "admin",
      actorUserId: "admin-1",
      entry: makeEntry({
        userId: "admin-2",
        role: "admin",
      }),
    });

    expect(creatorOwner).toMatchObject({
      canManage: false,
      canRevoke: false,
      assignableRoles: ["operator", "viewer"],
    });
    expect(peerAdmin).toMatchObject({
      canManage: false,
      canRevoke: false,
      assignableRoles: ["operator", "viewer"],
    });
  });

  it("does not allow managing yourself even for owner", () => {
    const selfEntry = getAccessRowCapabilities({
      actorRole: "owner",
      actorUserId: "owner-1",
      entry: makeEntry({
        userId: "owner-1",
        role: "owner",
      }),
    });

    expect(selfEntry.canManage).toBe(false);
    expect(selfEntry.canRevoke).toBe(false);
  });
});

describe("buildAccessMetrics", () => {
  it("counts only active access rows and only pending invites", () => {
    const metrics = buildAccessMetrics(
      [
        makeEntry({ userId: "user-1" }),
        makeEntry({ id: "access-2", userId: "user-2" }),
        makeEntry({ id: "access-3", userId: "user-3", revokedAt: "2026-04-11T12:00:00Z" }),
      ],
      [
        makeInvite({ id: "invite-1", status: "pending" }),
        makeInvite({ id: "invite-2", status: "accepted" }),
      ],
    );

    expect(metrics).toEqual([
      {
        id: "users_total",
        title: "Всего пользователей",
        value: "2",
        tone: "highlight",
      },
      {
        id: "invites_pending",
        title: "Ожидают приглашение",
        value: "1",
        tone: "default",
      },
    ]);
  });
});

describe("sortAccessEntries", () => {
  it("keeps active rows first and revoked rows after them", () => {
    const sorted = sortAccessEntries([
      makeEntry({ id: "revoked", email: "z@example.com", revokedAt: "2026-04-11T11:00:00Z" }),
      makeEntry({ id: "active-b", email: "b@example.com" }),
      makeEntry({ id: "active-a", email: "a@example.com" }),
    ]);

    expect(sorted.map((entry) => entry.id)).toEqual([
      "active-a",
      "active-b",
      "revoked",
    ]);
  });
});

describe("getInviteStatusPresentation", () => {
  it("maps accepted and expired invites to explicit labels", () => {
    expect(getInviteStatusPresentation("accepted")).toEqual({
      label: "Принято",
      tone: "active",
    });
    expect(getInviteStatusPresentation("expired")).toEqual({
      label: "Истекло",
      tone: "muted",
    });
  });
});
