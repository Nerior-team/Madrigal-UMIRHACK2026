def resolve_display_name(*, requested_display_name: str | None, pending_display_name: str | None, hostname: str) -> str:
    if requested_display_name:
        return requested_display_name.strip()
    if pending_display_name:
        return pending_display_name.strip()
    return hostname.strip()
