from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


PRODUCT_PATTERN = "^(nerior|crossplat|smart-planner|karpik)$"
DISCUSSION_CATEGORY_PATTERN = "^(general|feedback|integration|support|product)$"
REACTION_PATTERN = "^(like|dislike)$"


class CommunityDiscussionCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    product: str = Field(pattern=PRODUCT_PATTERN)
    category: str = Field(pattern=DISCUSSION_CATEGORY_PATTERN)
    author_name: str = Field(min_length=2, max_length=80)
    title: str = Field(min_length=4, max_length=160)
    body: str = Field(min_length=10, max_length=4000)


class CommunityCommentCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    author_name: str = Field(min_length=2, max_length=80)
    body: str = Field(min_length=2, max_length=3000)
    parent_id: str | None = Field(default=None, max_length=36)


class CommunityCommentReactionWrite(BaseModel):
    reaction: str = Field(pattern=REACTION_PATTERN)


class CommunityReviewCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    product: str = Field(pattern=PRODUCT_PATTERN)
    author_name: str = Field(min_length=2, max_length=80)
    role_title: str | None = Field(default=None, max_length=120)
    rating: int = Field(ge=1, le=5)
    advantages: str = Field(min_length=2, max_length=2000)
    disadvantages: str = Field(min_length=2, max_length=2000)
    body: str | None = Field(default=None, max_length=4000)


class CommunityCommentRead(BaseModel):
    id: str
    discussion_id: str
    parent_id: str | None
    author_name: str
    body: str
    like_count: int
    dislike_count: int
    created_at: datetime
    replies: list["CommunityCommentRead"] = Field(default_factory=list)


class CommunityDiscussionRead(BaseModel):
    id: str
    product: str
    category: str
    author_name: str
    title: str
    body: str
    comment_count: int
    created_at: datetime
    updated_at: datetime
    comments: list[CommunityCommentRead]


class CommunityDiscussionListResponse(BaseModel):
    items: list[CommunityDiscussionRead]


class CommunityReviewRead(BaseModel):
    id: str
    product: str
    author_name: str
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
