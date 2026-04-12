export type AccessActorRole = "owner" | "admin" | "operator" | "viewer";
export type AccessInviteStatus =
  | "pending"
  | "accepted"
  | "expired"
  | "invalidated";

export type AccessEntryLike = {
  id: string;
  machineId: string;
  machineName: string;
  userId: string;
  email: string;
  role: AccessActorRole;
  createdAt: string;
  revokedAt?: string | null;
  isCreatorOwner: boolean;
};

export type InviteLike = {
  id: string;
  machineId: string;
  machineName: string;
  email: string;
  role: AccessActorRole;
  status: AccessInviteStatus;
  expiresAt: string;
};

export function getAssignableRoles(actorRole: AccessActorRole): AccessActorRole[] {
  if (actorRole === "owner") {
    return ["admin", "operator", "viewer"];
  }

  if (actorRole === "admin") {
    return ["operator", "viewer"];
  }

  return [];
}

export function getAccessRowCapabilities(input: {
  actorRole: AccessActorRole;
  actorUserId: string;
  entry: AccessEntryLike;
}): {
  canManage: boolean;
  canRevoke: boolean;
  assignableRoles: AccessActorRole[];
} {
  const assignableRoles = getAssignableRoles(input.actorRole);
  const actorCanManageAccess =
    input.actorRole === "owner" || input.actorRole === "admin";
  const isSelf = input.entry.userId === input.actorUserId;
  const targetIsProtected =
    input.entry.isCreatorOwner ||
    (input.actorRole === "admin" &&
      (input.entry.role === "admin" || input.entry.role === "owner"));
  const canManage =
    actorCanManageAccess &&
    !input.entry.revokedAt &&
    !isSelf &&
    !targetIsProtected;

  return {
    canManage,
    canRevoke: canManage,
    assignableRoles,
  };
}

export function buildAccessMetrics(
  entries: AccessEntryLike[],
  invites: InviteLike[],
): Array<{ id: string; title: string; value: string; tone: "default" | "highlight" }> {
  const activeEntries = entries.filter((entry) => !entry.revokedAt);
  const activeUsers = new Set(activeEntries.map((entry) => entry.userId));
  const pendingInvites = invites.filter((invite) => invite.status === "pending");

  return [
    {
      id: "users_total",
      title: "Всего пользователей",
      value: String(activeUsers.size),
      tone: "highlight",
    },
    {
      id: "invites_pending",
      title: "Ожидают приглашение",
      value: String(pendingInvites.length),
      tone: "default",
    },
  ];
}

export function sortAccessEntries(entries: AccessEntryLike[]): AccessEntryLike[] {
  return [...entries].sort((left, right) => {
    const leftRevoked = left.revokedAt ? 1 : 0;
    const rightRevoked = right.revokedAt ? 1 : 0;

    if (leftRevoked !== rightRevoked) {
      return leftRevoked - rightRevoked;
    }

    const machineComparison = left.machineName.localeCompare(right.machineName, "ru");
    if (machineComparison !== 0) {
      return machineComparison;
    }

    return left.email.localeCompare(right.email, "ru");
  });
}

export function getInviteStatusPresentation(status: AccessInviteStatus): {
  label: string;
  tone: "active" | "pending" | "muted";
} {
  if (status === "accepted") {
    return { label: "Принято", tone: "active" };
  }

  if (status === "expired") {
    return { label: "Истекло", tone: "muted" };
  }

  if (status === "invalidated") {
    return { label: "Аннулировано", tone: "muted" };
  }

  return { label: "Ожидает", tone: "pending" };
}
