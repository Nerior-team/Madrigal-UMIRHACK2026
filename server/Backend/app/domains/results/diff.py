from app.domains.results.schemas import ResultDiffChangeRead, ResultDiffRead


def _to_scalar(value):
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    return str(value)


def _collect_changes(*, left, right, path: str, changes: list[ResultDiffChangeRead]) -> None:
    if isinstance(left, dict) and isinstance(right, dict):
        for key in sorted(set(left.keys()) | set(right.keys())):
            next_path = f"{path}.{key}" if path else key
            _collect_changes(left=left.get(key), right=right.get(key), path=next_path, changes=changes)
        return

    if isinstance(left, list) and isinstance(right, list):
        max_len = max(len(left), len(right))
        for index in range(max_len):
            next_path = f"{path}[{index}]"
            left_value = left[index] if index < len(left) else None
            right_value = right[index] if index < len(right) else None
            _collect_changes(left=left_value, right=right_value, path=next_path, changes=changes)
        return

    if left != right:
        changes.append(
            ResultDiffChangeRead(
                path=path or "value",
                left_value=_to_scalar(left),
                right_value=_to_scalar(right),
            )
        )


def build_result_diff(*, left_result_id: str, right_result_id: str, left_snapshot: dict, right_snapshot: dict) -> ResultDiffRead:
    changes: list[ResultDiffChangeRead] = []
    _collect_changes(left=left_snapshot, right=right_snapshot, path="", changes=changes)
    return ResultDiffRead(
        left_result_id=left_result_id,
        right_result_id=right_result_id,
        has_changes=bool(changes),
        changes=changes,
    )
