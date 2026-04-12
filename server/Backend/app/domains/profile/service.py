from dataclasses import dataclass

from app.core.exceptions import AppError
from app.domains.profile.repository import ProfileRepository
from app.domains.profile.schemas import UserProfileRead, UserProfileUpdateRequest
from app.infra.observability.audit import record_audit_event
from app.shared.enums import AuditStatus


@dataclass(slots=True)
class ProfileClientContext:
    ip_address: str | None
    user_agent: str | None


def build_full_name(*, first_name: str, last_name: str, fallback_email: str) -> str:
    parts = [part.strip() for part in (first_name, last_name) if part.strip()]
    if parts:
        return " ".join(parts)
    return fallback_email


class ProfileService:
    def __init__(self, *, profile_repository: ProfileRepository, auth_repository) -> None:
        self.profile_repository = profile_repository
        self.auth_repository = auth_repository

    def _validate_avatar(self, avatar_data_url: str | None) -> str | None:
        if not avatar_data_url:
            return None
        if not avatar_data_url.startswith("data:image/"):
            raise AppError("profile_avatar_invalid", "Аватар должен быть изображением.", 400)
        return avatar_data_url

    def _build_read(self, *, user, profile) -> UserProfileRead:
        return UserProfileRead(
            first_name=profile.first_name,
            last_name=profile.last_name,
            full_name=build_full_name(
                first_name=profile.first_name,
                last_name=profile.last_name,
                fallback_email=user.email,
            ),
            avatar_data_url=profile.avatar_data_url,
            deleted_machine_retention=profile.deleted_machine_retention,
        )

    def get_profile(self, *, user) -> UserProfileRead:
        profile = self.profile_repository.get_or_create_profile(user.id)
        return self._build_read(user=user, profile=profile)

    def update_profile(
        self,
        *,
        user,
        payload: UserProfileUpdateRequest,
        client: ProfileClientContext,
    ) -> UserProfileRead:
        profile = self.profile_repository.get_or_create_profile(user.id)
        profile.first_name = payload.first_name.strip()
        profile.last_name = payload.last_name.strip()
        profile.avatar_data_url = self._validate_avatar(payload.avatar_data_url)
        profile.deleted_machine_retention = payload.deleted_machine_retention
        self.profile_repository.save(profile)
        record_audit_event(
            self.auth_repository,
            user_id=user.id,
            action="profile.updated",
            status=AuditStatus.SUCCESS,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
            details={
                "deleted_machine_retention": payload.deleted_machine_retention.value,
                "has_avatar": bool(profile.avatar_data_url),
            },
        )
        self.profile_repository.commit()
        return self._build_read(user=user, profile=profile)
