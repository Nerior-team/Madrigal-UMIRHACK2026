from dataclasses import dataclass
from datetime import timedelta

from app.core.config import get_settings
from app.core.exceptions import AppError
from app.core.security import generate_session_token, hash_token
from app.domains.access.repository import AccessRepository
from app.domains.auth.repository import AuthRepository
from app.domains.commands.repository import CommandRepository
from app.domains.commands.service import CommandService
from app.domains.integrations.telegram.repository import TelegramRepository
from app.domains.integrations.telegram.schemas import (
    TelegramBotAuthPromptRead,
    TelegramBotCommandsResponse,
    TelegramBotDecisionResponse,
    TelegramBotMachineDetailResponse,
    TelegramBotMachinesResponse,
    TelegramBotProfileRead,
    TelegramBotResultDetailResponse,
    TelegramBotResultsResponse,
    TelegramBotStartRequest,
    TelegramBotStartResponse,
    TelegramBotTaskCreateRequest,
    TelegramBotTaskDetailResponse,
    TelegramBotTaskLogsResponse,
    TelegramBotTasksResponse,
    TelegramLinkStartResponse,
    TelegramLinkStatusRead,
)
from app.domains.integrations.telegram.webhook import build_telegram_deep_link
from app.domains.machines.repository import MachineRepository
from app.domains.machines.service import MachineClientContext, MachineService
from app.domains.reports.repository import ReportsRepository
from app.domains.reports.service import ReportsService
from app.domains.results.repository import ResultRepository
from app.domains.results.service import ResultService
from app.domains.tasks.repository import TaskRepository
from app.domains.tasks.service import TaskService
from app.infra.observability.audit import record_audit_event
from app.shared.enums import AuditStatus, AuthChallengeKind, TaskStatus
from app.shared.time import utc_now


@dataclass(slots=True)
class TelegramClientContext:
    ip_address: str | None
    user_agent: str | None


class TelegramIntegrationService:
    def __init__(
        self,
        *,
        auth_repository: AuthRepository,
        telegram_repository: TelegramRepository,
        access_repository: AccessRepository,
        machine_repository: MachineRepository,
        command_repository: CommandRepository,
        task_repository: TaskRepository,
        result_repository: ResultRepository,
        reports_repository: ReportsRepository,
    ) -> None:
        self.auth_repository = auth_repository
        self.telegram_repository = telegram_repository
        self.access_repository = access_repository
        self.machine_repository = machine_repository
        self.command_repository = command_repository
        self.task_repository = task_repository
        self.result_repository = result_repository
        self.reports_repository = reports_repository
        self.machine_service = MachineService(machine_repository, access_repository)
        self.command_service = CommandService(
            access_repository=access_repository,
            machine_repository=machine_repository,
            command_repository=command_repository,
            auth_repository=auth_repository,
        )
        self.task_service = TaskService(
            access_repository=access_repository,
            machine_repository=machine_repository,
            command_repository=command_repository,
            task_repository=task_repository,
            result_repository=result_repository,
        )
        self.result_service = ResultService(
            result_repository=result_repository,
            task_repository=task_repository,
            machine_repository=machine_repository,
            access_repository=access_repository,
        )
        self.reports_service = ReportsService(
            reports_repository=reports_repository,
            machine_repository=machine_repository,
            access_repository=access_repository,
        )

    def _build_profile(self, *, user_id: str) -> TelegramLinkStatusRead:
        link = self.telegram_repository.get_active_link_by_user_id(user_id=user_id)
        settings = self.auth_repository.get_or_create_two_factor_settings(user_id)
        return TelegramLinkStatusRead(
            linked=link is not None,
            telegram_user_id=None if link is None else link.telegram_user_id,
            telegram_chat_id=None if link is None else link.telegram_chat_id,
            telegram_username=None if link is None else link.telegram_username,
            telegram_first_name=None if link is None else link.telegram_first_name,
            linked_at=None if link is None else link.linked_at,
            two_factor_enabled=settings.telegram_enabled,
            bot_username=get_settings().telegram_bot_username,
        )

    def _require_valid_reauth(self, *, user_id: str, reauth_token: str) -> None:
        challenge = self.auth_repository.get_valid_auth_challenge_by_payload_hash(
            user_id=user_id,
            challenge_kind=AuthChallengeKind.REAUTH,
            payload_hash=hash_token(reauth_token, purpose="reauth"),
        )
        if challenge is None:
            raise AppError("reauth_required", "РўСЂРµР±СѓРµС‚СЃСЏ РїРѕРІС‚РѕСЂРЅРѕРµ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ Р»РёС‡РЅРѕСЃС‚Рё.", 401)
        challenge.consumed_at = utc_now()
        self.auth_repository.save(challenge)

    def _issue_link(self, *, user_id: str) -> TelegramLinkStartResponse:
        raw_token = generate_session_token()
        expires_at = utc_now() + timedelta(minutes=get_settings().telegram_link_ttl_minutes)
        self.telegram_repository.revoke_active_link_tokens(user_id=user_id)
        self.telegram_repository.create_link_token(
            user_id=user_id,
            token_hash=hash_token(raw_token, purpose="telegram_link"),
            expires_at=expires_at,
        )
        return TelegramLinkStartResponse(
            link_url=build_telegram_deep_link(raw_token),
            expires_at=expires_at,
        )

    def get_profile(self, *, actor_user_id: str) -> TelegramLinkStatusRead:
        return self._build_profile(user_id=actor_user_id)

    def start_link(self, *, actor_user_id: str, client: TelegramClientContext) -> TelegramLinkStartResponse:
        response = self._issue_link(user_id=actor_user_id)
        record_audit_event(
            self.telegram_repository,
            user_id=actor_user_id,
            action="telegram.link_started",
            status=AuditStatus.SUCCESS,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
            details={"expires_at": response.expires_at.isoformat()},
        )
        self.telegram_repository.commit()
        return response

    def unlink(self, *, actor_user, reauth_token: str, client: TelegramClientContext) -> None:
        self._require_valid_reauth(user_id=actor_user.id, reauth_token=reauth_token)
        settings = self.auth_repository.get_or_create_two_factor_settings(actor_user.id)
        settings.telegram_enabled = False
        self.auth_repository.save(settings)
        self.telegram_repository.revoke_links_for_user(user_id=actor_user.id)
        record_audit_event(
            self.telegram_repository,
            user_id=actor_user.id,
            action="telegram.unlinked",
            status=AuditStatus.SUCCESS,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
        )
        self.telegram_repository.commit()

    def start_telegram_2fa_setup(self, *, actor_user_id: str) -> tuple[TelegramLinkStatusRead, TelegramLinkStartResponse | None]:
        profile = self._build_profile(user_id=actor_user_id)
        if profile.linked:
            return profile, None
        return profile, self._issue_link(user_id=actor_user_id)

    def enable_telegram_2fa(self, *, actor_user, reauth_token: str, client: TelegramClientContext) -> None:
        self._require_valid_reauth(user_id=actor_user.id, reauth_token=reauth_token)
        link = self.telegram_repository.get_active_link_by_user_id(user_id=actor_user.id)
        if link is None:
            raise AppError("telegram_not_linked", "СЃРЅР°С‡Р°Р»Р° РїСЂРёРІСЏР¶РёС‚Рµ Telegram.", 400)
        settings = self.auth_repository.get_or_create_two_factor_settings(actor_user.id)
        settings.telegram_enabled = True
        self.auth_repository.save(settings)
        record_audit_event(
            self.telegram_repository,
            user_id=actor_user.id,
            action="telegram.2fa_enabled",
            status=AuditStatus.SUCCESS,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
        )
        self.telegram_repository.commit()

    def disable_telegram_2fa(self, *, actor_user, reauth_token: str, client: TelegramClientContext) -> None:
        self._require_valid_reauth(user_id=actor_user.id, reauth_token=reauth_token)
        settings = self.auth_repository.get_or_create_two_factor_settings(actor_user.id)
        settings.telegram_enabled = False
        self.auth_repository.save(settings)
        record_audit_event(
            self.telegram_repository,
            user_id=actor_user.id,
            action="telegram.2fa_disabled",
            status=AuditStatus.SUCCESS,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
        )
        self.telegram_repository.commit()

    def _resolve_bot_user(self, *, telegram_user_id: str):
        link = self.telegram_repository.get_active_link_by_telegram_user_id(telegram_user_id=telegram_user_id)
        if link is None:
            raise AppError("telegram_not_linked", "Telegram-аккаунт не привязан.", 404)
        user = self.auth_repository.get_user_by_id(link.user_id)
        if user is None:
            raise AppError("user_not_found", "Пользователь не найден.", 404)
        return user, link

    def handle_bot_start(self, *, payload: TelegramBotStartRequest, client: TelegramClientContext) -> TelegramBotStartResponse:
        linked = self.telegram_repository.get_active_link_by_telegram_user_id(telegram_user_id=payload.telegram_user_id)
        if payload.deep_link_payload and payload.deep_link_payload.startswith("link_"):
            raw_token = payload.deep_link_payload.removeprefix("link_")
            link_token = self.telegram_repository.get_active_link_token_by_hash(
                token_hash=hash_token(raw_token, purpose="telegram_link")
            )
            if link_token is None:
                return TelegramBotStartResponse(
                    linked=linked is not None,
                    text="Ссылка на привязку недействительна или уже использована.",
                )

            self.telegram_repository.revoke_links_for_user(user_id=link_token.user_id)
            self.telegram_repository.revoke_links_for_telegram_identity(
                telegram_user_id=payload.telegram_user_id,
                telegram_chat_id=payload.telegram_chat_id,
            )
            link = self.telegram_repository.create_user_link(
                user_id=link_token.user_id,
                telegram_user_id=payload.telegram_user_id,
                telegram_chat_id=payload.telegram_chat_id,
                telegram_username=payload.telegram_username,
                telegram_first_name=payload.telegram_first_name,
            )
            link_token.consumed_at = utc_now()
            self.telegram_repository.save(link_token)
            user = self.auth_repository.get_user_by_id(link.user_id)
            record_audit_event(
                self.telegram_repository,
                user_id=link.user_id,
                action="telegram.link_completed",
                status=AuditStatus.SUCCESS,
                ip_address=client.ip_address,
                user_agent=client.user_agent,
                details={"telegram_user_id": link.telegram_user_id, "telegram_chat_id": link.telegram_chat_id},
            )
            self.telegram_repository.commit()
            return TelegramBotStartResponse(
                linked=True,
                link_consumed=True,
                text=f"Telegram привязан к аккаунту {user.email}. Теперь можно пользоваться ботом.",
            )

        if linked is None:
            return TelegramBotStartResponse(
                linked=False,
                text="Этот Telegram пока не привязан. Запусти привязку из веба или desktop и открой ссылку ещё раз.",
            )

        user = self.auth_repository.get_user_by_id(linked.user_id)
        return TelegramBotStartResponse(
            linked=True,
            text=f"Готово. Аккаунт {user.email} уже привязан к этому Telegram.",
        )

    def get_bot_profile(self, *, telegram_user_id: str) -> TelegramBotProfileRead:
        user, link = self._resolve_bot_user(telegram_user_id=telegram_user_id)
        settings = self.auth_repository.get_or_create_two_factor_settings(user.id)
        return TelegramBotProfileRead(
            email=user.email,
            linked=True,
            telegram_username=link.telegram_username,
            telegram_first_name=link.telegram_first_name,
            linked_at=link.linked_at,
            two_factor_enabled=settings.telegram_enabled,
        )

    def list_bot_machines(self, *, telegram_user_id: str) -> TelegramBotMachinesResponse:
        user, _ = self._resolve_bot_user(telegram_user_id=telegram_user_id)
        return TelegramBotMachinesResponse(items=self.machine_service.list_for_user(actor_user_id=user.id))

    def get_bot_machine(self, *, telegram_user_id: str, machine_id: str) -> TelegramBotMachineDetailResponse:
        user, _ = self._resolve_bot_user(telegram_user_id=telegram_user_id)
        return TelegramBotMachineDetailResponse(
            machine=self.machine_service.get_detail_for_user(machine_id=machine_id, actor_user_id=user.id)
        )

    def list_bot_commands(self, *, telegram_user_id: str, machine_id: str) -> TelegramBotCommandsResponse:
        user, _ = self._resolve_bot_user(telegram_user_id=telegram_user_id)
        return TelegramBotCommandsResponse(
            items=self.command_service.list_templates_for_machine(machine_id=machine_id, actor_user_id=user.id)
        )

    def create_bot_task(
        self,
        *,
        telegram_user_id: str,
        payload: TelegramBotTaskCreateRequest,
        client: TelegramClientContext,
    ) -> TelegramBotTaskDetailResponse:
        user, _ = self._resolve_bot_user(telegram_user_id=telegram_user_id)
        task = self.task_service.create_task(
            actor_user=user,
            payload=payload,
            client=MachineClientContext(ip_address=client.ip_address, user_agent=client.user_agent),
        )
        return TelegramBotTaskDetailResponse(task=task)

    def list_bot_tasks(self, *, telegram_user_id: str, machine_id: str) -> TelegramBotTasksResponse:
        user, _ = self._resolve_bot_user(telegram_user_id=telegram_user_id)
        tasks = self.task_service.list_tasks(actor_user_id=user.id, machine_id=machine_id)
        return TelegramBotTasksResponse(items=tasks[:10])

    def get_bot_task(self, *, telegram_user_id: str, task_id: str) -> TelegramBotTaskDetailResponse:
        user, _ = self._resolve_bot_user(telegram_user_id=telegram_user_id)
        return TelegramBotTaskDetailResponse(task=self.task_service.get_task(actor_user_id=user.id, task_id=task_id))

    def get_bot_task_logs(self, *, telegram_user_id: str, task_id: str) -> TelegramBotTaskLogsResponse:
        user, _ = self._resolve_bot_user(telegram_user_id=telegram_user_id)
        logs = self.task_service.get_task_logs(actor_user_id=user.id, task_id=task_id)
        return TelegramBotTaskLogsResponse(items=logs[-50:])

    def retry_bot_task(self, *, telegram_user_id: str, task_id: str, client: TelegramClientContext) -> TelegramBotTaskDetailResponse:
        user, _ = self._resolve_bot_user(telegram_user_id=telegram_user_id)
        task = self.task_service.retry_task(
            actor_user=user,
            task_id=task_id,
            client=MachineClientContext(ip_address=client.ip_address, user_agent=client.user_agent),
        )
        return TelegramBotTaskDetailResponse(task=task)

    def cancel_bot_task(self, *, telegram_user_id: str, task_id: str, client: TelegramClientContext) -> TelegramBotDecisionResponse:
        user, _ = self._resolve_bot_user(telegram_user_id=telegram_user_id)
        outcome = self.task_service.cancel_task(
            actor_user=user,
            task_id=task_id,
            client=MachineClientContext(ip_address=client.ip_address, user_agent=client.user_agent),
        )
        return TelegramBotDecisionResponse(message=outcome.response.message)

    def list_bot_results(self, *, telegram_user_id: str, machine_id: str) -> TelegramBotResultsResponse:
        user, _ = self._resolve_bot_user(telegram_user_id=telegram_user_id)
        items = self.result_service.list_machine_history(actor_user_id=user.id, machine_id=machine_id)
        return TelegramBotResultsResponse(items=items[:10])

    def get_bot_result(self, *, telegram_user_id: str, result_id: str) -> TelegramBotResultDetailResponse:
        user, _ = self._resolve_bot_user(telegram_user_id=telegram_user_id)
        return TelegramBotResultDetailResponse(
            result=self.task_service.get_result(actor_user_id=user.id, result_id=result_id),
            summary=self.reports_service.get_result_summary(actor_user_id=user.id, result_id=result_id),
        )

    def should_notify_machine(self, *, machine_id: str) -> bool:
        return self.task_service.should_notify_machine(machine_id=machine_id)

    def list_pending_auth_prompts(self) -> list[TelegramBotAuthPromptRead]:
        items: list[TelegramBotAuthPromptRead] = []
        for challenge in self.telegram_repository.list_pending_login_challenges(limit=20):
            decision = self.telegram_repository.get_auth_decision(challenge_id=challenge.id)
            if decision is not None and (decision.notified_at is not None or decision.approved_at is not None or decision.rejected_at is not None):
                continue
            link = self.telegram_repository.get_active_link_by_user_id(user_id=challenge.user_id)
            if link is None:
                continue
            settings = self.auth_repository.get_or_create_two_factor_settings(challenge.user_id)
            if not settings.telegram_enabled:
                continue
            user = self.auth_repository.get_user_by_id(challenge.user_id)
            if user is None:
                continue
            items.append(
                TelegramBotAuthPromptRead(
                    challenge_id=challenge.id,
                    telegram_user_id=link.telegram_user_id,
                    telegram_chat_id=link.telegram_chat_id,
                    user_email=user.email,
                    prompt_text="Подтвердить вход в Crossplat?",
                    expires_at=challenge.expires_at,
                )
            )
        return items

    def mark_auth_prompt_notified(
        self,
        *,
        challenge_id: str,
        telegram_user_id: str,
        telegram_chat_id: str,
        message_id: int,
    ) -> None:
        challenge = self.auth_repository.get_auth_challenge(challenge_id)
        if challenge is None:
            raise AppError("challenge_invalid", "Challenge не найден.", 404)
        decision = self.telegram_repository.get_or_create_auth_decision(
            challenge_id=challenge_id,
            telegram_user_id=telegram_user_id,
        )
        decision.telegram_chat_id = telegram_chat_id
        decision.telegram_message_id = message_id
        decision.notified_at = utc_now()
        self.telegram_repository.save(decision)
        self.telegram_repository.commit()

    def approve_auth_prompt(self, *, challenge_id: str, telegram_user_id: str, telegram_chat_id: str) -> TelegramBotDecisionResponse:
        challenge = self.auth_repository.get_auth_challenge(challenge_id)
        if challenge is None or challenge.consumed_at is not None or challenge.expires_at < utc_now():
            raise AppError("challenge_invalid", "Запрос подтверждения входа уже недействителен.", 400)
        link = self.telegram_repository.get_active_link_by_telegram_user_id(telegram_user_id=telegram_user_id)
        if link is None or link.user_id != challenge.user_id or link.telegram_chat_id != telegram_chat_id:
            raise AppError("challenge_access_denied", "Этот запрос не относится к текущему Telegram.", 403)
        decision = self.telegram_repository.get_or_create_auth_decision(
            challenge_id=challenge_id,
            telegram_user_id=telegram_user_id,
        )
        decision.telegram_chat_id = telegram_chat_id
        decision.approved_at = utc_now()
        decision.rejected_at = None
        self.telegram_repository.save(decision)
        self.telegram_repository.commit()
        return TelegramBotDecisionResponse(message="Вход подтверждён. Можно возвращаться в окно авторизации.")

    def reject_auth_prompt(self, *, challenge_id: str, telegram_user_id: str, telegram_chat_id: str) -> TelegramBotDecisionResponse:
        challenge = self.auth_repository.get_auth_challenge(challenge_id)
        if challenge is None or challenge.consumed_at is not None or challenge.expires_at < utc_now():
            raise AppError("challenge_invalid", "Запрос подтверждения входа уже недействителен.", 400)
        link = self.telegram_repository.get_active_link_by_telegram_user_id(telegram_user_id=telegram_user_id)
        if link is None or link.user_id != challenge.user_id or link.telegram_chat_id != telegram_chat_id:
            raise AppError("challenge_access_denied", "Этот запрос не относится к текущему Telegram.", 403)
        decision = self.telegram_repository.get_or_create_auth_decision(
            challenge_id=challenge_id,
            telegram_user_id=telegram_user_id,
        )
        decision.telegram_chat_id = telegram_chat_id
        decision.rejected_at = utc_now()
        decision.approved_at = None
        self.telegram_repository.save(decision)
        self.telegram_repository.commit()
        return TelegramBotDecisionResponse(message="Вход отклонён.")
