from datetime import datetime

from pydantic import BaseModel

from app.shared.enums import MachineStatus


class AgentRatingRead(BaseModel):
    score: int
    label: str
    success_rate_percent: int
    avg_duration_ms: int | None


class MachineMetricsRead(BaseModel):
    machine_id: str
    status: MachineStatus
    last_heartbeat_at: datetime | None
    total_tasks: int
    succeeded_tasks: int
    failed_tasks: int
    cancelled_tasks: int
    avg_duration_ms: int | None
    last_result_at: datetime | None
    rating: AgentRatingRead
