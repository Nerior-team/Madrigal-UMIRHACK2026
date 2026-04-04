from app.core.exceptions import AppError
from app.domains.access.repository import AccessRepository
from app.domains.access.roles import ensure_can_view_machine
from app.domains.machines.repository import MachineRepository
from app.domains.metrics.rating import build_agent_rating
from app.domains.metrics.repository import MetricsRepository
from app.domains.metrics.schemas import MachineMetricsRead


class MetricsService:
    def __init__(
        self,
        task_repository,
        machine_repository: MachineRepository,
        access_repository: AccessRepository,
        metrics_repository: MetricsRepository | None = None,
    ) -> None:
        self.task_repository = task_repository
        self.machine_repository = machine_repository
        self.access_repository = access_repository
        self.metrics_repository = metrics_repository or MetricsRepository(machine_repository.db)

    def get_machine_metrics(self, *, actor_user_id: str, machine_id: str) -> MachineMetricsRead:
        machine = self.machine_repository.get_machine(machine_id)
        if machine is None:
            raise AppError("machine_not_found", "Машина не найдена.", 404)
        access = self.access_repository.get_access(machine_id, actor_user_id)
        if access is None or access.revoked_at is not None:
            raise AppError("machine_access_denied", "Доступ к машине запрещён.", 403)
        ensure_can_view_machine(access.role)

        snapshot = self.metrics_repository.build_machine_snapshot(machine_id)
        return MachineMetricsRead(
            machine_id=machine.id,
            status=machine.status,
            last_heartbeat_at=machine.last_heartbeat_at,
            total_tasks=snapshot.total_tasks,
            succeeded_tasks=snapshot.succeeded_tasks,
            failed_tasks=snapshot.failed_tasks,
            cancelled_tasks=snapshot.cancelled_tasks,
            avg_duration_ms=snapshot.avg_duration_ms,
            last_result_at=snapshot.last_result_at,
            rating=build_agent_rating(
                total_tasks=snapshot.total_tasks,
                succeeded_tasks=snapshot.succeeded_tasks,
                avg_duration_ms=snapshot.avg_duration_ms,
            ),
        )
