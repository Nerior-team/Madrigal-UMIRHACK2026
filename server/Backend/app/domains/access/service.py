from dataclasses import dataclass
from datetime import timedelta

from app.core.config import get_settings
from app.core.exceptions import AppError
from app.core.security import generate_session_token, hash_token, normalize_email
from app.domains.auth.repository import AuthRepository
from app.domains.access.invites import build_invite_message
from app.domains.access.repository import AccessRepository
from app.domains.access.roles import ensure_can_grant_role, ensure_can_manage_access, ensure_can_view_machine
from app.domains.access.schemas import (
    MachineAccessRevokeRequest,
    MachineAccessEntryRead,
    MachineInviteAcceptResponse,
    MachineInviteCreateRequest,
    MachineInvitePreview,
    MachineInviteRead,
    MachineRoleUpdateRequest,
    MessageResponse,
)
from app.domains.access.sharing import ensure_invite_is_active
from app.domains.machines.repository import MachineRepository
from app.infra.email.client import get_mail_transport
from app.infra.observability.audit import record_audit_event
from app.realtime.broker import operator_feed
from app.realtime.events import operator_event
from app.shared.enums import AuditStatus, AuthChallengeKind, MachineInviteStatus
from app.shared.time import utc_now


@dataclass(slots=True)
class AccessContext:
    actor_access: object
    ownership: object | None
    machine: object
    actor_is_creator_owner: bool


class AccessService:
    def __init__(
        self,
        access_repository: AccessRepository,
        machine_repository: MachineRepository,
        auth_repository: AuthRepository,
    ) -> None:
        self.access_repository = access_repository
        self.machine_repository = machine_repository
        self.auth_repository = auth_repository
        self.mailer = get_mail_transport()

    def _publish_operator_event(self, *, event_type: str, machine_id: str, payload: dict) -> None:
        operator_feed.publish(operator_event(event_type=event_type, machine_id=machine_id, payload=payload))

    def _get_context(self, *, machine_id: str, actor_user_id: str) -> AccessContext:
        machine = self.machine_repository.get_machine(machine_id)
        if machine is None:
            raise AppError("machine_not_found", "Машина не найдена.", 404)

        ownership = self.access_repository.get_ownership(machine_id)
        actor_access = self.access_repository.get_access(machine_id, actor_user_id)
        if actor_access is None or actor_access.revoked_at is not None:
            raise AppError("machine_access_denied", "Доступ к машине запрещён.", 403)

        return AccessContext(
            actor_access=actor_access,
            ownership=ownership,
            machine=machine,
            actor_is_creator_owner=ownership is not None and ownership.creator_user_id == actor_user_id,
        )

    def _build_access_entry(
        self,
        *,
        access,
        email: str,
        creator_user_id: str | None,
    ) -> MachineAccessEntryRead:
        return MachineAccessEntryRead(
            id=access.id,
            user_id=access.user_id,
            email=email,
            role=access.role,
            granted_by_user_id=access.granted_by_user_id,
            created_at=access.created_at,
            revoked_at=access.revoked_at,
            is_creator_owner=creator_user_id == access.user_id,
        )

    def _ensure_invite_is_active(self, invite) -> None:
        try:
            ensure_invite_is_active(invite)
        except AppError:
            if invite.status == MachineInviteStatus.EXPIRED:
                self.access_repository.save(invite)
                self.access_repository.commit()
            raise

    def _require_valid_reauth(self, *, user_id: str, reauth_token: str) -> None:
        challenge = self.auth_repository.get_valid_auth_challenge_by_payload_hash(
            user_id=user_id,
            challenge_kind=AuthChallengeKind.REAUTH,
            payload_hash=hash_token(reauth_token, purpose="reauth"),
        )
        if challenge is None:
            raise AppError("reauth_required", "Требуется повторное подтверждение личности.", 401)
        challenge.consumed_at = utc_now()
        self.auth_repository.save(challenge)

    def list_access(self, *, machine_id: str, actor_user_id: str) -> list[MachineAccessEntryRead]:
        context = self._get_context(machine_id=machine_id, actor_user_id=actor_user_id)
        ensure_can_view_machine(context.actor_access.role)
        rows = self.access_repository.list_access_entries(machine_id)
        return [
            self._build_access_entry(
                access=access,
                email=email,
                creator_user_id=creator_user_id,
            )
            for access, email, creator_user_id in rows
        ]

    def create_invite(
        self,
        *,
        machine_id: str,
        actor_user,
        payload: MachineInviteCreateRequest,
        client,
    ) -> MachineInviteRead:
        context = self._get_context(machine_id=machine_id, actor_user_id=actor_user.id)
        ensure_can_grant_role(
            actor_role=context.actor_access.role,
            actor_is_creator_owner=context.actor_is_creator_owner,
            requested_role=payload.role,
        )
        self._require_valid_reauth(user_id=actor_user.id, reauth_token=payload.reauth_token)

        raw_token = generate_session_token()
        invite = self.access_repository.create_invite(
            machine_id=machine_id,
            email=normalize_email(payload.email),
            role=payload.role,
            invite_token_hash=hash_token(raw_token, purpose="machine_invite"),
            invited_by_user_id=actor_user.id,
            expires_at=utc_now() + timedelta(hours=get_settings().machine_invite_ttl_hours),
        )

        subject, html_body, text_body = build_invite_message(
            raw_token=raw_token,
            machine_display_name=context.machine.display_name,
            email=invite.email,
            role=invite.role.value,
        )
        self.mailer.send(to_email=invite.email, subject=subject, html_body=html_body, text_body=text_body)

        record_audit_event(
            self.access_repository,
            user_id=actor_user.id,
            action="access.invite_created",
            status=AuditStatus.SUCCESS,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
            details={"machine_id": machine_id, "email": invite.email, "role": invite.role.value},
        )
        self.access_repository.commit()
        self._publish_operator_event(
            event_type="invite_updated",
            machine_id=machine_id,
            payload={
                "invite_id": invite.id,
                "machine_id": machine_id,
                "email": invite.email,
                "role": invite.role.value,
                "status": invite.status.value,
            },
        )

        return MachineInviteRead(
            id=invite.id,
            email=invite.email,
            role=invite.role,
            status=invite.status,
            expires_at=invite.expires_at,
            invited_by_user_id=invite.invited_by_user_id,
        )

    def get_invite_preview(self, *, raw_token: str) -> MachineInvitePreview:
        invite = self.access_repository.get_invite_by_hash(hash_token(raw_token, purpose="machine_invite"))
        if invite is None:
            raise AppError("invite_not_found", "Приглашение не найдено.", 404)

        self._ensure_invite_is_active(invite)

        machine = self.machine_repository.get_machine(invite.machine_id)
        if machine is None:
            raise AppError("machine_not_found", "Машина не найдена.", 404)

        return MachineInvitePreview(
            machine_id=machine.id,
            machine_display_name=machine.display_name,
            email=invite.email,
            role=invite.role,
            status=invite.status,
            expires_at=invite.expires_at,
        )

    def accept_invite(self, *, raw_token: str, actor_user, client) -> MachineInviteAcceptResponse:
        invite = self.access_repository.get_invite_by_hash(hash_token(raw_token, purpose="machine_invite"))
        if invite is None:
            raise AppError("invite_not_found", "Приглашение не найдено.", 404)

        self._ensure_invite_is_active(invite)

        actor_email = normalize_email(actor_user.email)
        if actor_email != invite.email:
            invite.status = MachineInviteStatus.INVALIDATED
            invite.invalidated_at = utc_now()
            invite.invalidated_reason = "foreign_account_attempt"
            self.access_repository.save(invite)
            record_audit_event(
                self.access_repository,
                user_id=actor_user.id,
                action="access.invite_invalidated",
                status=AuditStatus.FAILURE,
                ip_address=client.ip_address,
                user_agent=client.user_agent,
                details={"machine_id": invite.machine_id, "email": invite.email},
            )
            self.access_repository.commit()
            self._publish_operator_event(
                event_type="invite_updated",
                machine_id=invite.machine_id,
                payload={
                    "invite_id": invite.id,
                    "machine_id": invite.machine_id,
                    "email": invite.email,
                    "status": invite.status.value,
                    "reason": invite.invalidated_reason,
                },
            )
            raise AppError("invite_email_mismatch", "Это приглашение создано для другого email.", 403)

        self.access_repository.upsert_access(
            machine_id=invite.machine_id,
            user_id=actor_user.id,
            role=invite.role,
            granted_by_user_id=invite.invited_by_user_id,
        )
        invite.status = MachineInviteStatus.ACCEPTED
        invite.accepted_at = utc_now()
        invite.accepted_by_user_id = actor_user.id
        self.access_repository.save(invite)

        record_audit_event(
            self.access_repository,
            user_id=actor_user.id,
            action="access.invite_accepted",
            status=AuditStatus.SUCCESS,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
            details={"machine_id": invite.machine_id, "role": invite.role.value},
        )
        self.access_repository.commit()
        self._publish_operator_event(
            event_type="invite_updated",
            machine_id=invite.machine_id,
            payload={
                "invite_id": invite.id,
                "machine_id": invite.machine_id,
                "email": invite.email,
                "status": invite.status.value,
            },
        )
        self._publish_operator_event(
            event_type="access_updated",
            machine_id=invite.machine_id,
            payload={
                "machine_id": invite.machine_id,
                "target_user_id": actor_user.id,
                "role": invite.role.value,
                "action": "accepted",
            },
        )

        return MachineInviteAcceptResponse(machine_id=invite.machine_id, role=invite.role)

    def update_role(
        self,
        *,
        machine_id: str,
        access_id: str,
        actor_user,
        payload: MachineRoleUpdateRequest,
        client,
    ) -> MachineAccessEntryRead:
        context = self._get_context(machine_id=machine_id, actor_user_id=actor_user.id)
        target = self.access_repository.get_access_by_id(access_id)
        if target is None or target.machine_id != machine_id:
            raise AppError("machine_access_not_found", "Запись доступа не найдена.", 404)
        if target.user_id == actor_user.id:
            raise AppError("self_role_change_forbidden", "Нельзя менять собственную роль.", 400)

        ensure_can_manage_access(
            actor_role=context.actor_access.role,
            actor_is_creator_owner=context.actor_is_creator_owner,
            target_role=target.role,
            target_is_creator_owner=context.ownership is not None and context.ownership.creator_user_id == target.user_id,
        )
        ensure_can_grant_role(
            actor_role=context.actor_access.role,
            actor_is_creator_owner=context.actor_is_creator_owner,
            requested_role=payload.role,
        )
        self._require_valid_reauth(user_id=actor_user.id, reauth_token=payload.reauth_token)

        target.role = payload.role
        self.access_repository.save(target)
        target_user = self.access_repository.get_user_by_id(target.user_id)
        if target_user is None:
            raise AppError("user_not_found", "Пользователь не найден.", 404)

        record_audit_event(
            self.access_repository,
            user_id=actor_user.id,
            action="access.role_updated",
            status=AuditStatus.SUCCESS,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
            details={"machine_id": machine_id, "target_user_id": target.user_id, "role": payload.role.value},
        )
        self.access_repository.commit()
        self._publish_operator_event(
            event_type="access_updated",
            machine_id=machine_id,
            payload={
                "machine_id": machine_id,
                "target_user_id": target.user_id,
                "role": payload.role.value,
                "action": "role_updated",
            },
        )

        return self._build_access_entry(
            access=target,
            email=target_user.email,
            creator_user_id=context.ownership.creator_user_id if context.ownership is not None else None,
        )

    def revoke_access(
        self,
        *,
        machine_id: str,
        access_id: str,
        actor_user,
        payload: MachineAccessRevokeRequest,
        client,
    ) -> MessageResponse:
        context = self._get_context(machine_id=machine_id, actor_user_id=actor_user.id)
        target = self.access_repository.get_access_by_id(access_id)
        if target is None or target.machine_id != machine_id:
            raise AppError("machine_access_not_found", "Запись доступа не найдена.", 404)
        if target.user_id == actor_user.id:
            raise AppError("self_revoke_forbidden", "Нельзя отозвать собственный доступ.", 400)

        ensure_can_manage_access(
            actor_role=context.actor_access.role,
            actor_is_creator_owner=context.actor_is_creator_owner,
            target_role=target.role,
            target_is_creator_owner=context.ownership is not None and context.ownership.creator_user_id == target.user_id,
        )
        self._require_valid_reauth(user_id=actor_user.id, reauth_token=payload.reauth_token)

        target.revoked_at = utc_now()
        self.access_repository.save(target)
        record_audit_event(
            self.access_repository,
            user_id=actor_user.id,
            action="access.revoked",
            status=AuditStatus.SUCCESS,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
            details={"machine_id": machine_id, "target_user_id": target.user_id},
        )
        self.access_repository.commit()

        self._publish_operator_event(
            event_type="access_updated",
            machine_id=machine_id,
            payload={
                "machine_id": machine_id,
                "target_user_id": target.user_id,
                "role": target.role.value,
                "action": "revoked",
            },
        )
        return MessageResponse(message="Доступ отозван.")
