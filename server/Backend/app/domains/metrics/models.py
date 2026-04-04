from dataclasses import dataclass
from datetime import datetime


@dataclass(slots=True)
class MachineMetricSnapshot:
    machine_id: str
    total_tasks: int
    succeeded_tasks: int
    failed_tasks: int
    cancelled_tasks: int
    avg_duration_ms: int | None
    last_result_at: datetime | None
