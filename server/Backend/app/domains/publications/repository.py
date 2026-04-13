from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domains.publications.models import Publication
from app.shared.enums import PublicationCategory, PublicationStatus


class PublicationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_publications(self, *, category: PublicationCategory | None = None) -> list[Publication]:
        statement = (
            select(Publication)
            .where(Publication.status == PublicationStatus.PUBLISHED)
            .order_by(Publication.published_at.desc().nullslast(), Publication.created_at.desc())
        )
        if category is not None:
            statement = statement.where(Publication.category == category)
        return list(self.db.scalars(statement).all())

    def get_publication_by_slug(self, slug: str) -> Publication | None:
        statement = select(Publication).where(
            Publication.slug == slug,
            Publication.status == PublicationStatus.PUBLISHED,
        )
        return self.db.scalar(statement)
