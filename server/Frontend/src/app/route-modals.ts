import type { AppRoute, AppRouteModal, WorkspaceAppRoute } from "../core/routes";

export function getRouteModal(route: AppRoute): AppRouteModal | null {
  if (route.section !== "workspace") {
    return null;
  }

  return route.modal ?? null;
}

export function hasRouteModal(
  route: AppRoute,
): route is WorkspaceAppRoute & { modal: AppRouteModal } {
  return getRouteModal(route) !== null;
}
