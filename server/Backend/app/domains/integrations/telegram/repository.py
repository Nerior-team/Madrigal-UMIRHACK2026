from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.domains.auth.models import AuditEvent, UserAuthChallenge
from app.domains.integrations.telegram.models import TelegramAuthDecision, TelegramLinkToken, TelegramUserLink
from app.domains.users.models import User
from app.shared.enums import AuthChallengeKind, TwoFactorMethod
from app.shared.time import utc_now


class TelegramRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def save(self, entity) -> None:
        self.db.add(entity)
        self.db.flush()

    def commit(self) -> None:
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()

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

    def create_link_token(self, *, user_id: str, token_hash: str, expires_at) -> TelegramLinkToken:
        link_token = TelegramLinkToken(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
        self.db.add(link_token)
        self.db.flush()
        return link_token

    def revoke_active_link_tokens(self, *, user_id: str) -> int:
        tokens = list(
            self.db.scalars(
                select(TelegramLinkToken).where(
                    TelegramLinkToken.user_id == user_id,
                    TelegramLinkToken.consumed_at.is_(None),
                    TelegramLinkToken.expires_at >= utc_now(),
                )
            ).all()
        )
        for token in tokens:
            token.consumed_at = utc_now()
            self.db.add(token)
        self.db.flush()
        return len(tokens)

    def get_active_link_token_by_hash(self, *, token_hash: str) -> TelegramLinkToken | None:
        return self.db.scalar(
            select(TelegramLinkToken).where(
                TelegramLinkToken.token_hash == token_hash,
                TelegramLinkToken.consumed_at.is_(None),
                TelegramLinkToken.expires_at >= utc_now(),
            )
        )

    def get_active_link_by_user_id(self, *, user_id: str) -> TelegramUserLink | None:
        return self.db.scalar(
            select(TelegramUserLink)
            .where(
                TelegramUserLink.user_id == user_id,
                TelegramUserLink.revoked_at.is_(None),
            )
            .order_by(TelegramUserLink.linked_at.desc())
        )

    def get_active_link_by_telegram_user_id(self, *, telegram_user_id: str) -> TelegramUserLink | None:
        return self.db.scalar(
            select(TelegramUserLink)
            .where(
                TelegramUserLink.telegram_user_id == telegram_user_id,
                TelegramUserLink.revoked_at.is_(None),
            )
            .order_by(TelegramUserLink.linked_at.desc())
        )

    def get_active_link_by_chat_id(self, *, telegram_chat_id: str) -> TelegramUserLink | None:
        return self.db.scalar(
            select(TelegramUserLink)
            .where(
                TelegramUserLink.telegram_chat_id == telegram_chat_id,
                TelegramUserLink.revoked_at.is_(None),
            )
            .order_by(TelegramUserLink.linked_at.desc())
        )

    def revoke_links_for_user(self, *, user_id: str) -> int:
        links = list(
            self.db.scalars(
                select(TelegramUserLink).where(
                    TelegramUserLink.user_id == user_id,
                    TelegramUserLink.revoked_at.is_(None),
                )
            ).all()
        )
        for link in links:
            link.revoked_at = utc_now()
            self.db.add(link)
        self.db.flush()
        return len(links)

    def revoke_links_for_telegram_identity(self, *, telegram_user_id: str, telegram_chat_id: str) -> int:
        links = list(
            self.db.scalars(
                select(TelegramUserLink).where(
                    TelegramUserLink.revoked_at.is_(None),
                    or_(
                        TelegramUserLink.telegram_user_id == telegram_user_id,
                        TelegramUserLink.telegram_chat_id == telegram_chat_id,
                    ),
                )
            ).all()
        )
        for link in links:
            link.revoked_at = utc_now()
            self.db.add(link)
        self.db.flush()
        return len(links)

    def create_user_link(
        self,
        *,
        user_id: str,
        telegram_user_id: str,
        telegram_chat_id: str,
        telegram_username: str | None,
        telegram_first_name: str | None,
    ) -> TelegramUserLink:
        link = TelegramUserLink(
            user_id=user_id,
            telegram_user_id=telegram_user_id,
            telegram_chat_id=telegram_chat_id,
            telegram_username=telegram_username,
            telegram_first_name=telegram_first_name,
        )
        self.db.add(link)
        self.db.flush()
        return link

    def get_user_by_id(self, user_id: str) -> User | None:
        return self.db.get(User, user_id)

    def get_user_by_telegram_user_id(self, telegram_user_id: str) -> User | None:
        link = self.get_active_link_by_telegram_user_id(telegram_user_id=telegram_user_id)
        if link is None:
            return None
        return self.get_user_by_id(link.user_id)

    def list_pending_login_challenges(self, *, limit: int = 20) -> list[UserAuthChallenge]:
        statement = (
            select(UserAuthChallenge)
            .where(
                UserAuthChallenge.challenge_kind == AuthChallengeKind.LOGIN_TELEGRAM,
                UserAuthChallenge.method == TwoFactorMethod.TELEGRAM,
                UserAuthChallenge.consumed_at.is_(None),
                UserAuthChallenge.expires_at >= utc_now(),
            )
            .order_by(UserAuthChallenge.created_at.asc())
            .limit(limit)
        )
        return list(self.db.scalars(statement).all())

    def get_auth_decision(self, *, challenge_id: str) -> TelegramAuthDecision | None:
        return self.db.get(TelegramAuthDecision, challenge_id)

    def get_or_create_auth_decision(self, *, challenge_id: str, telegram_user_id: str) -> TelegramAuthDecision:
        decision = self.get_auth_decision(challenge_id=challenge_id)
        if decision is not None:
            return decision
        decision = TelegramAuthDecision(challenge_id=challenge_id, telegram_user_id=telegram_user_id)
        self.db.add(decision)
        self.db.flush()
        return decision
