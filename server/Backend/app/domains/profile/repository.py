from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domains.profile.models import UserProfile


class ProfileRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_profile(self, user_id: str) -> UserProfile | None:
        return self.db.scalar(select(UserProfile).where(UserProfile.user_id == user_id))

    def get_or_create_profile(self, user_id: str) -> UserProfile:
        profile = self.get_profile(user_id)
        if profile is not None:
            return profile
        profile = UserProfile(user_id=user_id)
        self.db.add(profile)
        self.db.flush()
        return profile

    def save(self, profile: UserProfile) -> None:
        self.db.add(profile)
        self.db.flush()

    def commit(self) -> None:
        self.db.commit()
