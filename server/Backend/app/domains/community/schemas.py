from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.shared.enums import PublicationCategory, PublicationStatus


PRODUCT_PATTERN = "^(nerior|crossplat|smart-planner|karpik)$"
DISCUSSION_CATEGORY_PATTERN = "^(general|feedback|integration|support|product)$"
REACTION_PATTERN = "^(like|dislike)$"
REVIEW_SORT_PATTERN = "^(rating_desc|rating_asc|newest|oldest)$"


class CommunityDiscussionCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    product: str = Field(pattern=PRODUCT_PATTERN)
    category: str = Field(pattern=DISCUSSION_CATEGORY_PATTERN)
    title: str = Field(min_length=4, max_length=160)
    body: str = Field(min_length=10, max_length=4000)
    image_data_url: str | None = Field(default=None, max_length=2_000_000)


class CommunityCommentCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    body: str = Field(min_length=2, max_length=3000)
    parent_id: str | None = Field(default=None, max_length=36)


class CommunityCommentReactionWrite(BaseModel):
    reaction: str = Field(pattern=REACTION_PATTERN)


class CommunityDiscussionReactionWrite(BaseModel):
    reaction: str = Field(pattern="^like$")


class CommunityReviewCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    product: str = Field(pattern=PRODUCT_PATTERN)
    rating: int = Field(ge=1, le=5)
    advantages: str = Field(min_length=2, max_length=2000)
    disadvantages: str = Field(min_length=2, max_length=2000)
    body: str | None = Field(default=None, max_length=4000)


class CommunityAuthorRead(BaseModel):
    user_id: str | None
    display_name: str
    email: str | None = None
    avatar_data_url: str | None = None
    is_verified: bool = False
    role_tag: str | None = None
    is_admin: bool = False


class CommunityCommentRead(BaseModel):
    id: str
    discussion_id: str
    parent_id: str | None
    author: CommunityAuthorRead
    body: str
    like_count: int
    dislike_count: int
    viewer_reaction: str | None = None
    created_at: datetime
    replies: list["CommunityCommentRead"] = Field(default_factory=list)


class CommunityDiscussionRead(BaseModel):
    id: str
    product: str
    category: str
    author: CommunityAuthorRead
    title: str
    body: str
    image_data_url: str | None = None
    like_count: int
    viewer_reaction: str | None = None
    comment_count: int
    created_at: datetime
    updated_at: datetime
    comments: list[CommunityCommentRead]


class CommunityDiscussionListResponse(BaseModel):
    items: list[CommunityDiscussionRead]


class CommunityReviewRead(BaseModel):
    id: str
    product: str
    author: CommunityAuthorRead
    role_title: str | None
    rating: int
    advantages: str
    disadvantages: str
    body: str | None
    created_at: datetime


class CommunityReviewSummaryRead(BaseModel):
    product: str
    average_rating: float
    total_reviews: int
    rating_breakdown: dict[str, int]


class CommunityReviewListResponse(BaseModel):
    summary: CommunityReviewSummaryRead
    items: list[CommunityReviewRead]


class CommunityReactionRead(BaseModel):
    id: str
    like_count: int
    dislike_count: int
    viewer_reaction: str | None = None


class CommunityMemberProfileRead(BaseModel):
    user_id: str
    email: str
    display_name: str
    avatar_data_url: str | None = None
    is_verified: bool
    role_tag: str | None
    is_admin: bool
    is_root_admin: bool = False


class CommunityMemberProfileUpdate(BaseModel):
    is_verified: bool = False
    role_tag: str | None = Field(default=None, max_length=160)
    is_admin: bool = False


class CommunityMemberListResponse(BaseModel):
    items: list[CommunityMemberProfileRead]


class CommunityAdminContextRead(BaseModel):
    profile: CommunityMemberProfileRead


class CommunityViewerContextRead(BaseModel):
    authenticated: bool
    profile: CommunityMemberProfileRead | None = None


class CommunityMessageResponse(BaseModel):
    message: str


class PublicationBlockWrite(BaseModel):
    model_config = ConfigDict(extra="allow")

    kind: str
    value: str | None = None
    url: str | None = None
    caption: str | None = None
    title: str | None = None


class CommunityPublicationAdminWrite(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    slug: str = Field(min_length=3, max_length=160)
    title: str = Field(min_length=4, max_length=255)
    summary: str = Field(min_length=10, max_length=4000)
    category: PublicationCategory
    status: PublicationStatus = PublicationStatus.DRAFT
    preview_image_url: str | None = None
    preview_video_url: str | None = None
    body_blocks: list[PublicationBlockWrite] = Field(default_factory=list)
    published_at: datetime | None = None


class CommunityPublicationAdminRead(BaseModel):
    id: str
    slug: str
    title: str
    summary: str
    category: PublicationCategory
    status: PublicationStatus
    preview_image_url: str | None
    preview_video_url: str | None
    body_blocks: list[PublicationBlockWrite]
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime


class CommunityPublicationAdminListResponse(BaseModel):
    items: list[CommunityPublicationAdminRead]
