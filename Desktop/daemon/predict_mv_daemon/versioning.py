def parse_version(value: str) -> tuple[int, ...]:
    cleaned = value.strip().split("+", 1)[0].split("-", 1)[0]
    parts = [part for part in cleaned.split(".") if part != ""]
    if not parts:
        raise ValueError("Empty version")
    return tuple(int(part) for part in parts)


def is_newer_version(candidate: str, current: str) -> bool:
    candidate_parts = parse_version(candidate)
    current_parts = parse_version(current)
    max_len = max(len(candidate_parts), len(current_parts))
    padded_candidate = candidate_parts + (0,) * (max_len - len(candidate_parts))
    padded_current = current_parts + (0,) * (max_len - len(current_parts))
    return padded_candidate > padded_current
