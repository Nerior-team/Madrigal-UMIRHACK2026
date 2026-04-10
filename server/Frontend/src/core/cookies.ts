const DEFAULT_COOKIE_SOURCE = () =>
  typeof document === "undefined" ? "" : document.cookie;

export function readCookie(
  name: string,
  cookieSource: string = DEFAULT_COOKIE_SOURCE(),
): string | null {
  if (!name.trim()) return null;

  const target = `${encodeURIComponent(name)}=`;
  for (const part of cookieSource.split(";")) {
    const normalized = part.trim();
    if (!normalized.startsWith(target)) continue;
    return decodeURIComponent(normalized.slice(target.length));
  }

  return null;
}
