import { api, type ProfileDashboardResponse } from "../core";
import { ApiError } from "../core/http";

function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

export async function bootstrapAuthSession(): Promise<ProfileDashboardResponse | null> {
  try {
    return await api.getProfileDashboard();
  } catch (error) {
    if (isUnauthorized(error)) {
      return null;
    }
    throw error;
  }
}

export async function terminateAuthSession(): Promise<void> {
  try {
    await api.logout();
  } catch (error) {
    if (isUnauthorized(error)) {
      return;
    }
    throw error;
  }
}
