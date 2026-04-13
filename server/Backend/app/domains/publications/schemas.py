from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.shared.enums import PublicationCategory


class PublicationBlockRead(BaseModel):
    model_config = ConfigDict(extra="allow")

    kind: str
    value: str | None = None
    url: str | None = None
    caption: str | None = None
    title: str | None = None


class PublicationListItemRead(BaseModel):
    id: str
    slug: str
    title: str
    summary: str
    category: PublicationCategory
    preview_image_url: str | None
    preview_video_url: str | None
    published_at: datetime | None


class PublicationDetailRead(PublicationListItemRead):
    body_blocks: list[PublicationBlockRead]


class PublicationListResponse(BaseModel):
    items: list[PublicationListItemRead]
