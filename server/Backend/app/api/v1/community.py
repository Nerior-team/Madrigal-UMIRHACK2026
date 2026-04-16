from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_community_repository
from app.core.exceptions import AppError
from app.domains.community import (
    CommunityCommentCreate,
    CommunityCommentRead,
    CommunityCommentReactionWrite,
    CommunityDiscussionCreate,
    CommunityDiscussionListResponse,
    CommunityDiscussionRead,
    CommunityReactionRead,
    CommunityRepository,
    CommunityReviewCreate,
    CommunityReviewListResponse,
    CommunityReviewRead,
    CommunityReviewSummaryRead,
)

router = APIRouter(prefix="/public/community", tags=["community"])


def _build_comment_tree(flat_comments) -> list[CommunityCommentRead]:
    items = {
        comment.id: CommunityCommentRead(
            id=comment.id,
            discussion_id=comment.discussion_id,
            parent_id=comment.parent_id,
            author_name=comment.author_name,
            body=comment.body,
            like_count=comment.like_count,
            dislike_count=comment.dislike_count,
            created_at=comment.created_at,
            replies=[],
        )
        for comment in flat_comments
    }
    roots: list[CommunityCommentRead] = []
    for comment in items.values():
        if comment.parent_id and comment.parent_id in items:
            items[comment.parent_id].replies.append(comment)
        else:
            roots.append(comment)
    return roots


def _build_discussion_read(repository: CommunityRepository, discussion) -> CommunityDiscussionRead:
    comments = _build_comment_tree(repository.list_comments(discussion_id=discussion.id))
    return CommunityDiscussionRead(
        id=discussion.id,
        product=discussion.product,
        category=discussion.category,
        author_name=discussion.author_name,
        title=discussion.title,
        body=discussion.body,
        comment_count=discussion.comment_count,
        created_at=discussion.created_at,
        updated_at=discussion.updated_at,
        comments=comments,
    )


def _build_review_summary(product: str, reviews) -> CommunityReviewSummaryRead:
    total_reviews = len(reviews)
    breakdown = {str(score): 0 for score in range(1, 6)}
    for review in reviews:
        breakdown[str(review.rating)] += 1
    average_rating = round(sum(review.rating for review in reviews) / total_reviews, 2) if total_reviews else 0.0
    return CommunityReviewSummaryRead(
        product=product,
        average_rating=average_rating,
        total_reviews=total_reviews,
        rating_breakdown=breakdown,
    )


@router.get("/discussions", response_model=CommunityDiscussionListResponse)
def list_discussions(
    product: Annotated[str | None, Query(pattern="^(nerior|crossplat|smart-planner|karpik)$")] = None,
    category: Annotated[str | None, Query(pattern="^(general|feedback|integration|support|product)$")] = None,
    repository: Annotated[CommunityRepository, Depends(get_community_repository)] = None,
) -> CommunityDiscussionListResponse:
    discussions = repository.list_discussions(product=product, category=category)
    return CommunityDiscussionListResponse(items=[_build_discussion_read(repository, discussion) for discussion in discussions])


@router.post("/discussions", response_model=CommunityDiscussionRead, status_code=status.HTTP_201_CREATED)
def create_discussion(
    payload: CommunityDiscussionCreate,
    repository: Annotated[CommunityRepository, Depends(get_community_repository)] = None,
) -> CommunityDiscussionRead:
    discussion = repository.create_discussion(payload)
    return _build_discussion_read(repository, discussion)


@router.post("/discussions/{discussion_id}/comments", response_model=CommunityCommentRead, status_code=status.HTTP_201_CREATED)
def create_comment(
    discussion_id: str,
    payload: CommunityCommentCreate,
    repository: Annotated[CommunityRepository, Depends(get_community_repository)] = None,
) -> CommunityCommentRead:
    discussion = repository.get_discussion(discussion_id)
    if discussion is None:
        raise AppError("community_discussion_not_found", "Обсуждение не найдено.", 404)

    if payload.parent_id is not None:
        parent = repository.get_comment(payload.parent_id)
        if parent is None or parent.discussion_id != discussion.id:
            raise AppError("community_parent_comment_not_found", "Комментарий для ответа не найден.", 404)

    comment = repository.create_comment(discussion=discussion, payload=payload)
    return CommunityCommentRead(
        id=comment.id,
        discussion_id=comment.discussion_id,
        parent_id=comment.parent_id,
        author_name=comment.author_name,
        body=comment.body,
        like_count=comment.like_count,
        dislike_count=comment.dislike_count,
        created_at=comment.created_at,
        replies=[],
    )


@router.post("/comments/{comment_id}/reaction", response_model=CommunityReactionRead)
def react_comment(
    comment_id: str,
    payload: CommunityCommentReactionWrite,
    repository: Annotated[CommunityRepository, Depends(get_community_repository)] = None,
) -> CommunityReactionRead:
    comment = repository.get_comment(comment_id)
    if comment is None:
        raise AppError("community_comment_not_found", "Комментарий не найден.", 404)
    comment = repository.react_comment(comment=comment, reaction=payload.reaction)
    return CommunityReactionRead(id=comment.id, like_count=comment.like_count, dislike_count=comment.dislike_count)


@router.get("/reviews", response_model=CommunityReviewListResponse)
def list_reviews(
    product: Annotated[str, Query(pattern="^(nerior|crossplat|smart-planner|karpik)$")] = "nerior",
    repository: Annotated[CommunityRepository, Depends(get_community_repository)] = None,
) -> CommunityReviewListResponse:
    reviews = repository.list_reviews(product=product)
    return CommunityReviewListResponse(
        summary=_build_review_summary(product, reviews),
        items=[
            CommunityReviewRead(
                id=review.id,
                product=review.product,
                author_name=review.author_name,
                role_title=review.role_title,
                rating=review.rating,
                advantages=review.advantages,
                disadvantages=review.disadvantages,
                body=review.body,
                created_at=review.created_at,
            )
            for review in reviews
        ],
    )


@router.post("/reviews", response_model=CommunityReviewRead, status_code=status.HTTP_201_CREATED)
def create_review(
    payload: CommunityReviewCreate,
    repository: Annotated[CommunityRepository, Depends(get_community_repository)] = None,
) -> CommunityReviewRead:
    review = repository.create_review(payload)
    return CommunityReviewRead(
        id=review.id,
        product=review.product,
        author_name=review.author_name,
        role_title=review.role_title,
        rating=review.rating,
        advantages=review.advantages,
        disadvantages=review.disadvantages,
        body=review.body,
        created_at=review.created_at,
    )
