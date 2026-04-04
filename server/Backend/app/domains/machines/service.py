from dataclasses import dataclass
from datetime import timedelta

from app.core.exceptions import AppError
from app.core.security import generate_session_token, hash_token
from app.domains.access.repository import AccessRepository
from app.domains.machines.inventory import resolve_display_name
from app.domains.machines.pairing import (
    decrypt_pending_machine_token,
    encrypt_pending_machine_token,
    issue_device_code,
    issue_machine_token,
    issue_registration_token,
    registration_ttl_minutes,
)
from app.domains.machines.repository import MachineRepository
from app.domains.machines.schemas import (
    MachineDetail,
    MachineHeartbeatRequest,
    MachineHeartbeatResponse,
    MachineRegistrationCompleteRequest,
    MachineRegistrationCompleteResponse,
    MachineRegistrationConfirmRequest,
    MachineRegistrationConfirmResponse,
    MachineRegistrationStartRequest,
    MachineRegistrationStartResponse,
    MachineSummary,
)
from app.infra.observability.audit import record_audit_event
from app.realtime.broker import operator_feed
from app.realtime.events import operator_event
from app.shared.enums import AuditStatus, MachineAccessRole, MachineStatus
from app.shared.time import has_expired, utc_now


@dataclass(slots=True)
class MachineClientContext:
    ip_address: str | None
    user_agent: str | None


class MachineService:
    def __init__(self, machine_repository: MachineRepository, access_repository: AccessRepository) -> None:
        self.machine_repository = machine_repository
        self.access_repository = access_repository

    def _publish_operator_event(self, *, event_type: str, machine_id: str, payload: dict) -> None:
        operator_feed.publish(operator_event(event_type=event_type, machine_id=machine_id, payload=payload))

    def start_registration(self, *, payload: MachineRegistrationStartRequest) -> MachineRegistrationStartResponse:
        raw_token = issue_registration_token()
        registration = self.machine_repository.create_registration(
            device_code=issue_device_code(),
            registration_token_hash=hash_token(raw_token, purpose="machine_registration"),
            pending_display_name=payload.display_name,
            pending_hostname=payload.hostname,
            pending_os_family=payload.os_family,
            pending_os_version=payload.os_version,
            pending_agent_version=payload.agent_version,
            expires_at=utc_now() + timedelta(minutes=registration_ttl_minutes()),
        )
        self.machine_repository.commit()
        return MachineRegistrationStartResponse(
            registration_id=registration.id,
            device_code=registration.device_code,
            registration_token=raw_token,
            expires_at=registration.expires_at,
        )

    def confirm_registration(
        self,
        *,
        actor_user,
        payload: MachineRegistrationConfirmRequest,
        client,
    ) -> MachineRegistrationConfirmResponse:
        registration = self.machine_repository.get_registration_by_device_code(payload.device_code.strip().upper())
        if registration is None:
            raise AppError("registration_not_found", "Регистрация машины не найдена.", 404)
        if registration.cancelled_at is not None:
            raise AppError("registration_cancelled", "Регистрация машины отменена.", 400)
        if registration.confirmed_at is not None:
            raise AppError("registration_confirmed", "Регистрация машины уже подтверждена.", 400)
        if has_expired(registration.expires_at):
            raise AppError("registration_expired", "Срок действия регистрации машины истёк.", 400)

        raw_machine_token = issue_machine_token()
        machine = self.machine_repository.create_machine(
            display_name=resolve_display_name(
                requested_display_name=payload.display_name,
                pending_display_name=registration.pending_display_name,
                hostname=registration.pending_hostname,
            ),
            hostname=registration.pending_hostname,
            os_family=registration.pending_os_family,
            os_version=registration.pending_os_version,
            machine_token_hash=hash_token(raw_machine_token, purpose="machine_access"),
        )
        self.access_repository.create_ownership(machine_id=machine.id, creator_user_id=actor_user.id)
        self.access_repository.upsert_access(
            machine_id=machine.id,
            user_id=actor_user.id,
            role=MachineAccessRole.OWNER,
            granted_by_user_id=None,
        )

        registration.machine_id = machine.id
        registration.confirmed_by_user_id = actor_user.id
        registration.confirmed_at = utc_now()
        registration.pending_machine_token_encrypted = encrypt_pending_machine_token(raw_machine_token)
        self.machine_repository.save(registration)

        record_audit_event(
            self.machine_repository,
            user_id=actor_user.id,
            action="machine.registration_confirmed",
            status=AuditStatus.SUCCESS,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
            details={"registration_id": registration.id, "machine_id": machine.id, "device_code": registration.device_code},
        )
        self.machine_repository.commit()
        return MachineRegistrationConfirmResponse(
            machine=MachineDetail(
                id=machine.id,
                display_name=machine.display_name,
                hostname=machine.hostname,
                os_family=machine.os_family,
                os_version=machine.os_version,
                status=machine.status,
                last_heartbeat_at=machine.last_heartbeat_at,
                owner_email=actor_user.email,
                my_role=MachineAccessRole.OWNER,
                creator_user_id=actor_user.id,
            )
        )

    def complete_registration(
        self,
        *,
        registration_id: str,
        payload: MachineRegistrationCompleteRequest,
        client,
    ) -> MachineRegistrationCompleteResponse:
        registration = self.machine_repository.get_registration(registration_id)
        if registration is None:
            raise AppError("registration_not_found", "Регистрация машины не найдена.", 404)
        if registration.registration_token_hash != hash_token(payload.registration_token, purpose="machine_registration"):
            raise AppError("registration_invalid", "Регистрационный токен недействителен.", 401)
        if registration.confirmed_at is None or registration.machine_id is None:
            raise AppError("registration_not_confirmed", "Регистрация машины ещё не подтверждена владельцем.", 409)
        if registration.completed_at is not None or not registration.pending_machine_token_encrypted:
            raise AppError("registration_completed", "Регистрация машины уже завершена.", 400)

        raw_machine_token = decrypt_pending_machine_token(registration.pending_machine_token_encrypted)
        registration.completed_at = utc_now()
        registration.pending_machine_token_encrypted = None
        self.machine_repository.save(registration)
        record_audit_event(
            self.machine_repository,
            user_id=registration.confirmed_by_user_id,
            action="machine.registration_completed",
            status=AuditStatus.SUCCESS,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
            details={"registration_id": registration.id, "machine_id": registration.machine_id},
        )
        self.machine_repository.commit()
        return MachineRegistrationCompleteResponse(machine_id=registration.machine_id, machine_token=raw_machine_token)

    def list_for_user(self, *, actor_user_id: str) -> list[MachineSummary]:
        rows = self.machine_repository.list_for_user(actor_user_id)
        return [
            MachineSummary(
                id=row.machine.id,
                display_name=row.machine.display_name,
                hostname=row.machine.hostname,
                os_family=row.machine.os_family,
                os_version=row.machine.os_version,
                status=row.machine.status,
                last_heartbeat_at=row.machine.last_heartbeat_at,
                owner_email=row.owner_email,
                my_role=row.my_role,
            )
            for row in rows
        ]

    def get_detail_for_user(self, *, machine_id: str, actor_user_id: str) -> MachineDetail:
        rows = self.machine_repository.list_for_user(actor_user_id)
        for row in rows:
            if row.machine.id == machine_id:
                return MachineDetail(
                    id=row.machine.id,
                    display_name=row.machine.display_name,
                    hostname=row.machine.hostname,
                    os_family=row.machine.os_family,
                    os_version=row.machine.os_version,
                    status=row.machine.status,
                    last_heartbeat_at=row.machine.last_heartbeat_at,
                    owner_email=row.owner_email,
                    my_role=row.my_role,
                    creator_user_id=row.creator_user_id,
                )
        raise AppError("machine_not_found", "Машина не найдена или недоступна.", 404)

    def authenticate_machine(self, *, machine_token: str):
        machine = self.machine_repository.get_machine_by_token_hash(hash_token(machine_token, purpose="machine_access"))
        if machine is None:
            raise AppError("machine_unauthorized", "Токен машины недействителен.", 401)
        return machine

    def get_agent_identity(self, *, machine_token: str):
        return self.authenticate_machine(machine_token=machine_token)

    def unpair_machine(self, *, machine_token: str, client) -> str:
        machine = self.authenticate_machine(machine_token=machine_token)
        machine.machine_token_hash = hash_token(generate_session_token(), purpose="machine_access")
        machine.status = MachineStatus.OFFLINE
        self.machine_repository.save(machine)

        heartbeat = self.machine_repository.get_heartbeat(machine.id)
        if heartbeat is not None:
            heartbeat.last_seen_at = utc_now()
            self.machine_repository.save(heartbeat)

        record_audit_event(
            self.machine_repository,
            user_id=None,
            action="machine.unpaired",
            status=AuditStatus.SUCCESS,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
            details={"machine_id": machine.id, "hostname": machine.hostname},
        )
        self.machine_repository.commit()
        self._publish_operator_event(
            event_type="machine_status_changed",
            machine_id=machine.id,
            payload={
                "machine_id": machine.id,
                "status": machine.status.value,
                "last_heartbeat_at": machine.last_heartbeat_at.isoformat() if machine.last_heartbeat_at else None,
                "hostname": machine.hostname,
                "os_family": machine.os_family.value,
            },
        )
        return machine.id

    def apply_heartbeat(self, *, machine_token: str, payload: MachineHeartbeatRequest, client) -> MachineHeartbeatResponse:
        machine = self.authenticate_machine(machine_token=machine_token)
        machine.status = MachineStatus.ONLINE
        machine.last_heartbeat_at = utc_now()
        self.machine_repository.save(machine)

        heartbeat = self.machine_repository.get_heartbeat(machine.id)
        if heartbeat is None:
            from app.domains.machines.models import MachineHeartbeat

            heartbeat = MachineHeartbeat(machine_id=machine.id, last_seen_at=utc_now())
        heartbeat.last_seen_at = utc_now()
        heartbeat.agent_version = payload.agent_version
        heartbeat.ip_address = client.ip_address
        heartbeat.status_payload = payload.status_payload
        self.machine_repository.save(heartbeat)
        self.machine_repository.commit()
        self._publish_operator_event(
            event_type="machine_status_changed",
            machine_id=machine.id,
            payload={
                "machine_id": machine.id,
                "status": machine.status.value,
                "last_heartbeat_at": machine.last_heartbeat_at.isoformat(),
                "hostname": machine.hostname,
                "os_family": machine.os_family.value,
            },
        )
        return MachineHeartbeatResponse(status="ok", machine_id=machine.id, last_seen_at=heartbeat.last_seen_at)
