const PLATFORM_PENDING_EMAIL_KEY = "platform-pending-email";
const PLATFORM_PENDING_CHALLENGE_KEY = "platform-pending-challenge";

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

export function setPlatformPendingEmail(email: string): void {
  if (!canUseStorage()) {
    return;
  }
  window.sessionStorage.setItem(PLATFORM_PENDING_EMAIL_KEY, email);
}

export function getPlatformPendingEmail(): string {
  if (!canUseStorage()) {
    return "";
  }
  return window.sessionStorage.getItem(PLATFORM_PENDING_EMAIL_KEY) ?? "";
}

export function clearPlatformPendingEmail(): void {
  if (!canUseStorage()) {
    return;
  }
  window.sessionStorage.removeItem(PLATFORM_PENDING_EMAIL_KEY);
}

export function setPlatformPendingChallenge(challengeId: string | null): void {
  if (!canUseStorage()) {
    return;
  }
  if (!challengeId) {
    window.sessionStorage.removeItem(PLATFORM_PENDING_CHALLENGE_KEY);
    return;
  }
  window.sessionStorage.setItem(PLATFORM_PENDING_CHALLENGE_KEY, challengeId);
}

export function getPlatformPendingChallenge(): string | null {
  if (!canUseStorage()) {
    return null;
  }
  return window.sessionStorage.getItem(PLATFORM_PENDING_CHALLENGE_KEY);
}

export function clearPlatformPendingChallenge(): void {
  if (!canUseStorage()) {
    return;
  }
  window.sessionStorage.removeItem(PLATFORM_PENDING_CHALLENGE_KEY);
}
