from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, Enum, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.shared.enums import PublicationCategory, PublicationStatus


class Publication(Base):
    __tablename__ = "publications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    slug: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[PublicationCategory] = mapped_column(Enum(PublicationCategory), nullable=False, index=True)
    status: Mapped[PublicationStatus] = mapped_column(
        Enum(PublicationStatus),
        default=PublicationStatus.DRAFT,
        nullable=False,
        index=True,
    )
    preview_image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    preview_video_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    body_blocks: Mapped[list[dict]] = mapped_column(JSON, default=list, nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
