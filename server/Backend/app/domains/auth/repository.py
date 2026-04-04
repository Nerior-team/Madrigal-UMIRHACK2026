from datetime import datetime

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.domains.auth.models import (
    AuditEvent,
    UserAuthChallenge,
    UserEmailVerification,
    UserPasswordReset,
    UserSession,
    UserTwoFactorSettings,
)
from app.domains.users.models import User
from app.shared.time import utc_now


class AuthRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_user_by_email(self, email: str) -> User | None:
        return self.db.scalar(select(User).where(User.email == email))

    def get_user_by_id(self, user_id: str) -> User | None:
        return self.db.get(User, user_id)

    def create_user(self, *, email: str, password_hash: str) -> User:
        user = User(email=email, password_hash=password_hash, is_active=False, email_verified=False)
        self.db.add(user)
        self.db.flush()
        return user

    def save(self, entity) -> None:
        self.db.add(entity)
        self.db.flush()

    def commit(self) -> None:
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()

    def create_email_verification(
        self, *, user_id: str, code_hash: str, code_last4: str, expires_at: datetime, max_attempts: int
    ) -> UserEmailVerification:
        verification = UserEmailVerification(
            user_id=user_id,
            code_hash=code_hash,
            code_last4=code_last4,
            expires_at=expires_at,
            max_attempts=max_attempts,
        )
        self.db.add(verification)
        self.db.flush()
        return verification

    def get_latest_email_verification(self, user_id: str) -> UserEmailVerification | None:
        statement: Select[tuple[UserEmailVerification]] = (
            select(UserEmailVerification)
            .where(UserEmailVerification.user_id == user_id, UserEmailVerification.consumed_at.is_(None))
            .order_by(UserEmailVerification.created_at.desc())
        )
        return self.db.scalar(statement)

    def create_password_reset(self, *, user_id: str, token_hash: str, expires_at: datetime) -> UserPasswordReset:
        reset = UserPasswordReset(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
        self.db.add(reset)
        self.db.flush()
        return reset

    def get_password_reset_by_hash(self, token_hash: str) -> UserPasswordReset | None:
        return self.db.scalar(
            select(UserPasswordReset).where(
                UserPasswordReset.token_hash == token_hash, UserPasswordReset.consumed_at.is_(None)
            )
        )

    def create_session(
        self,
        *,
        user_id: str,
        session_kind,
        access_token_hash: str,
        refresh_token_hash: str | None,
        access_expires_at: datetime,
        refresh_expires_at: datetime | None,
        ip_address: str | None,
        user_agent: str | None,
    ) -> UserSession:
        session = UserSession(
            user_id=user_id,
            session_kind=session_kind,
            access_token_hash=access_token_hash,
            refresh_token_hash=refresh_token_hash,
            access_expires_at=access_expires_at,
            refresh_expires_at=refresh_expires_at,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.db.add(session)
        self.db.flush()
        return session

    def get_session_by_access_hash(self, access_token_hash: str) -> UserSession | None:
        return self.db.scalar(select(UserSession).where(UserSession.access_token_hash == access_token_hash))

    def get_session_by_refresh_hash(self, refresh_token_hash: str) -> UserSession | None:
        return self.db.scalar(select(UserSession).where(UserSession.refresh_token_hash == refresh_token_hash))

    def revoke_session(self, session: UserSession, *, revoked_at: datetime) -> None:
        session.revoked_at = revoked_at
        self.db.add(session)
        self.db.flush()

    def revoke_user_sessions(self, *, user_id: str, revoked_at: datetime) -> int:
        sessions = list(
            self.db.scalars(select(UserSession).where(UserSession.user_id == user_id, UserSession.revoked_at.is_(None)))
        )
        for session in sessions:
            session.revoked_at = revoked_at
            self.db.add(session)
        self.db.flush()
        return len(sessions)

    def get_or_create_two_factor_settings(self, user_id: str) -> UserTwoFactorSettings:
        settings = self.db.scalar(select(UserTwoFactorSettings).where(UserTwoFactorSettings.user_id == user_id))
        if settings is not None:
            return settings
        settings = UserTwoFactorSettings(user_id=user_id)
        self.db.add(settings)
        self.db.flush()
        return settings

    def create_auth_challenge(
        self, *, user_id: str, challenge_kind, method, payload_hash: str | None, expires_at: datetime
    ) -> UserAuthChallenge:
        challenge = UserAuthChallenge(
            user_id=user_id,
            challenge_kind=challenge_kind,
            method=method,
            payload_hash=payload_hash,
            expires_at=expires_at,
        )
        self.db.add(challenge)
        self.db.flush()
        return challenge

    def get_auth_challenge(self, challenge_id: str) -> UserAuthChallenge | None:
        return self.db.get(UserAuthChallenge, challenge_id)

    def get_valid_auth_challenge_by_payload_hash(self, *, user_id: str, challenge_kind, payload_hash: str) -> UserAuthChallenge | None:
        return self.db.scalar(
            select(UserAuthChallenge).where(
                UserAuthChallenge.user_id == user_id,
                UserAuthChallenge.challenge_kind == challenge_kind,
                UserAuthChallenge.payload_hash == payload_hash,
                UserAuthChallenge.consumed_at.is_(None),
                UserAuthChallenge.expires_at >= utc_now(),
            )
        )

    def add_audit_event(
        self,
        *,
        user_id: str | None,
        action: str,
        status,
        ip_address: str | None,
        user_agent: str | None,
        details: dict | None = None,
    ) -> AuditEvent:
        event = AuditEvent(
            user_id=user_id,
            action=action,
            status=status,
            ip_address=ip_address,
            user_agent=user_agent,
            details=details,
        )
        self.db.add(event)
        self.db.flush()
        return event
