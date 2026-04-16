from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import (
    get_community_repository,
    get_current_user,
    get_optional_current_user,
)
from app.core.exceptions import AppError
from app.domains.community import (
    CommunityAdminContextRead,
    CommunityAuthorRead,
    CommunityCommentCreate,
    CommunityCommentRead,
    CommunityCommentReactionWrite,
    CommunityDiscussionCreate,
    CommunityDiscussionListResponse,
    CommunityDiscussionRead,
    CommunityDiscussionReactionWrite,
    CommunityMemberListResponse,
    CommunityMemberProfileRead,
    CommunityMemberProfileUpdate,
    CommunityMessageResponse,
    CommunityPublicationAdminListResponse,
    CommunityPublicationAdminRead,
    CommunityPublicationAdminWrite,
    CommunityReactionRead,
    CommunityRepository,
    CommunityReviewCreate,
    CommunityReviewListResponse,
    CommunityReviewRead,
    CommunityReviewSummaryRead,
    CommunityViewerContextRead,
)

router = APIRouter(prefix="/public/community", tags=["community"])


def _serialize_author(author) -> CommunityAuthorRead:
    return CommunityAuthorRead(
        user_id=author.user_id,
        display_name=author.display_name,
        email=author.email,
        avatar_data_url=author.avatar_data_url,
        is_verified=author.is_verified,
        role_tag=author.role_tag,
        is_admin=author.is_admin,
    )


def _serialize_member(
    *,
    repository: CommunityRepository,
    user,
    profiles: dict,
    member_profiles: dict,
) -> CommunityMemberProfileRead:
    author = repository.build_author_snapshot(
        user_id=user.id,
        fallback_name=user.email,
        users={user.id: user},
        profiles=profiles,
        member_profiles=member_profiles,
    )
    return CommunityMemberProfileRead(
        user_id=user.id,
        email=user.email,
        display_name=author.display_name,
        avatar_data_url=author.avatar_data_url,
        is_verified=author.is_verified,
        role_tag=author.role_tag,
        is_admin=author.is_admin,
        is_root_admin=repository.is_root_admin(user),
    )


def _serialize_viewer_context(
    repository: CommunityRepository,
    current_user,
) -> CommunityViewerContextRead:
    if current_user is None:
        return CommunityViewerContextRead(authenticated=False, profile=None)
    profiles = repository.list_profiles_for_users([current_user.id])
    member_profiles = repository.list_member_profiles_for_users([current_user.id])
    return CommunityViewerContextRead(
        authenticated=True,
        profile=_serialize_member(
            repository=repository,
            user=current_user,
            profiles=profiles,
            member_profiles=member_profiles,
        ),
    )


def _require_community_admin(repository: CommunityRepository, current_user) -> None:
    if current_user is None:
        raise AppError("community_admin_required", "Требуется авторизация.", 401)
    member_profile = repository.get_member_profile(current_user.id)
    if not repository.is_root_admin(current_user) and not (member_profile and member_profile.is_admin):
        raise AppError(
            "community_admin_required",
            "Требуются права администратора сообщества.",
            403,
        )


def _build_comment_tree(
    repository: CommunityRepository,
    comments,
    viewer_reactions: dict[str, str],
) -> list[CommunityCommentRead]:
    user_ids = [comment.author_user_id for comment in comments if comment.author_user_id]
    users = {
        item.id: item
        for item in (repository.get_user(user_id) for user_id in user_ids)
        if item is not None
    }
    profiles = repository.list_profiles_for_users(list(users))
    member_profiles = repository.list_member_profiles_for_users(list(users))
    items: dict[str, CommunityCommentRead] = {}
    roots: list[CommunityCommentRead] = []

    for comment in comments:
        author = repository.build_author_snapshot(
            user_id=comment.author_user_id,
            fallback_name=comment.author_name,
            users=users,
            profiles=profiles,
            member_profiles=member_profiles,
        )
        items[comment.id] = CommunityCommentRead(
            id=comment.id,
            discussion_id=comment.discussion_id,
            parent_id=comment.parent_id,
            author=_serialize_author(author),
            body=comment.body,
            like_count=comment.like_count,
            dislike_count=comment.dislike_count,
            viewer_reaction=viewer_reactions.get(comment.id),
            created_at=comment.created_at,
            replies=[],
        )

    for comment in items.values():
        if comment.parent_id and comment.parent_id in items:
            items[comment.parent_id].replies.append(comment)
        else:
            roots.append(comment)

    return roots


def _build_discussion_read(
    repository: CommunityRepository,
    discussion,
    *,
    current_user_id: str | None = None,
) -> CommunityDiscussionRead:
    comments = repository.list_comments(discussion_id=discussion.id)
    comment_reactions = repository.list_comment_reactions(
        [item.id for item in comments],
        viewer_user_id=current_user_id,
    )
    discussion_reactions = repository.list_discussion_reactions(
        [discussion.id],
        viewer_user_id=current_user_id,
    )
    user_ids = [discussion.author_user_id] if discussion.author_user_id else []
    users = {
        item.id: item
        for item in (repository.get_user(user_id) for user_id in user_ids)
        if item is not None
    }
    profiles = repository.list_profiles_for_users(list(users))
    member_profiles = repository.list_member_profiles_for_users(list(users))
    author = repository.build_author_snapshot(
        user_id=discussion.author_user_id,
        fallback_name=discussion.author_name,
        users=users,
        profiles=profiles,
        member_profiles=member_profiles,
    )
    return CommunityDiscussionRead(
        id=discussion.id,
        product=discussion.product,
        category=discussion.category,
        author=_serialize_author(author),
        title=discussion.title,
        body=discussion.body,
        image_data_url=discussion.image_data_url,
        like_count=discussion.like_count,
        viewer_reaction=discussion_reactions.get(discussion.id),
        comment_count=discussion.comment_count,
        created_at=discussion.created_at,
        updated_at=discussion.updated_at,
        comments=_build_comment_tree(repository, comments, comment_reactions),
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


def _build_review_read(repository: CommunityRepository, review) -> CommunityReviewRead:
    user_ids = [review.author_user_id] if review.author_user_id else []
    users = {
        item.id: item
        for item in (repository.get_user(user_id) for user_id in user_ids)
        if item is not None
    }
    profiles = repository.list_profiles_for_users(list(users))
    member_profiles = repository.list_member_profiles_for_users(list(users))
    author = repository.build_author_snapshot(
        user_id=review.author_user_id,
        fallback_name=review.author_name,
        users=users,
        profiles=profiles,
        member_profiles=member_profiles,
    )
    return CommunityReviewRead(
        id=review.id,
        product=review.product,
        author=_serialize_author(author),
        role_title=review.role_title,
        rating=review.rating,
        advantages=review.advantages,
        disadvantages=review.disadvantages,
        body=review.body,
        created_at=review.created_at,
    )


def _serialize_publication(item) -> CommunityPublicationAdminRead:
    return CommunityPublicationAdminRead(
        id=item.id,
        slug=item.slug,
        title=item.title,
        summary=item.summary,
        category=item.category,
        status=item.status,
        preview_image_url=item.preview_image_url,
        preview_video_url=item.preview_video_url,
        body_blocks=item.body_blocks,
        published_at=item.published_at,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


@router.get("/context", response_model=CommunityViewerContextRead)
def get_viewer_context(
    repository: Annotated[CommunityRepository, Depends(get_community_repository)],
    current_user=Depends(get_optional_current_user),
) -> CommunityViewerContextRead:
    return _serialize_viewer_context(repository, current_user)


@router.get("/discussions", response_model=CommunityDiscussionListResponse)
def list_discussions(
    product: Annotated[str | None, Query(pattern="^(nerior|crossplat|smart-planner|karpik)$")] = None,
    category: Annotated[str | None, Query(pattern="^(general|feedback|integration|support|product)$")] = None,
    search: str | None = None,
    repository: Annotated[CommunityRepository, Depends(get_community_repository)] = None,
    current_user=Depends(get_optional_current_user),
) -> CommunityDiscussionListResponse:
    discussions = repository.list_discussions(product=product, category=category, search=search)
    current_user_id = current_user.id if current_user is not None else None
    return CommunityDiscussionListResponse(
        items=[
            _build_discussion_read(
                repository,
                discussion,
                current_user_id=current_user_id,
            )
            for discussion in discussions
        ]
    )


@router.post("/discussions", response_model=CommunityDiscussionRead, status_code=status.HTTP_201_CREATED)
def create_discussion(
    payload: CommunityDiscussionCreate,
    repository: Annotated[CommunityRepository, Depends(get_community_repository)] = None,
    current_user=Depends(get_current_user),
) -> CommunityDiscussionRead:
    viewer = _serialize_viewer_context(repository, current_user)
    discussion = repository.create_discussion(
        payload=payload,
        user=current_user,
        display_name=viewer.profile.display_name,
    )
    return _build_discussion_read(repository, discussion, current_user_id=current_user.id)


@router.post("/discussions/{discussion_id}/reaction", response_model=CommunityReactionRead)
def react_discussion(
    discussion_id: str,
    payload: CommunityDiscussionReactionWrite,
    repository: Annotated[CommunityRepository, Depends(get_community_repository)] = None,
    current_user=Depends(get_current_user),
) -> CommunityReactionRead:
    discussion = repository.get_discussion(discussion_id)
    if discussion is None:
        raise AppError("community_discussion_not_found", "Обсуждение не найдено.", 404)
    discussion, viewer_reaction = repository.toggle_discussion_reaction(
        discussion=discussion,
        user=current_user,
        reaction=payload.reaction,
    )
    return CommunityReactionRead(
        id=discussion.id,
        like_count=discussion.like_count,
        dislike_count=0,
        viewer_reaction=viewer_reaction,
    )


@router.post("/discussions/{discussion_id}/comments", response_model=CommunityCommentRead, status_code=status.HTTP_201_CREATED)
def create_comment(
    discussion_id: str,
    payload: CommunityCommentCreate,
    repository: Annotated[CommunityRepository, Depends(get_community_repository)] = None,
    current_user=Depends(get_current_user),
) -> CommunityCommentRead:
    discussion = repository.get_discussion(discussion_id)
    if discussion is None:
        raise AppError("community_discussion_not_found", "Обсуждение не найдено.", 404)

    if payload.parent_id is not None:
        parent = repository.get_comment(payload.parent_id)
        if parent is None or parent.discussion_id != discussion.id:
            raise AppError(
                "community_parent_comment_not_found",
                "Комментарий для ответа не найден.",
                404,
            )

    viewer = _serialize_viewer_context(repository, current_user)
    comment = repository.create_comment(
        discussion=discussion,
        payload=payload,
        user=current_user,
        display_name=viewer.profile.display_name,
    )
    author = repository.build_author_snapshot(
        user_id=current_user.id,
        fallback_name=comment.author_name,
        users={current_user.id: current_user},
        profiles=repository.list_profiles_for_users([current_user.id]),
        member_profiles=repository.list_member_profiles_for_users([current_user.id]),
    )
    return CommunityCommentRead(
        id=comment.id,
        discussion_id=comment.discussion_id,
        parent_id=comment.parent_id,
        author=_serialize_author(author),
        body=comment.body,
        like_count=comment.like_count,
        dislike_count=comment.dislike_count,
        viewer_reaction=None,
        created_at=comment.created_at,
        replies=[],
    )


@router.post("/comments/{comment_id}/reaction", response_model=CommunityReactionRead)
def react_comment(
    comment_id: str,
    payload: CommunityCommentReactionWrite,
    repository: Annotated[CommunityRepository, Depends(get_community_repository)] = None,
    current_user=Depends(get_current_user),
) -> CommunityReactionRead:
    comment = repository.get_comment(comment_id)
    if comment is None:
        raise AppError("community_comment_not_found", "Комментарий не найден.", 404)
    comment, viewer_reaction = repository.toggle_comment_reaction(
        comment=comment,
        user=current_user,
        reaction=payload.reaction,
    )
    return CommunityReactionRead(
        id=comment.id,
        like_count=comment.like_count,
        dislike_count=comment.dislike_count,
        viewer_reaction=viewer_reaction,
    )


@router.get("/reviews", response_model=CommunityReviewListResponse)
def list_reviews(
    product: Annotated[str, Query(pattern="^(nerior|crossplat|smart-planner|karpik)$")] = "nerior",
    sort_by: Annotated[str, Query(pattern="^(rating_desc|rating_asc|newest|oldest)$")] = "newest",
    repository: Annotated[CommunityRepository, Depends(get_community_repository)] = None,
) -> CommunityReviewListResponse:
    reviews = repository.list_reviews(product=product, sort_by=sort_by)
    return CommunityReviewListResponse(
        summary=_build_review_summary(product, reviews),
        items=[_build_review_read(repository, review) for review in reviews],
    )


@router.post("/reviews", response_model=CommunityReviewRead, status_code=status.HTTP_201_CREATED)
def create_review(
    payload: CommunityReviewCreate,
    repository: Annotated[CommunityRepository, Depends(get_community_repository)] = None,
    current_user=Depends(get_current_user),
) -> CommunityReviewRead:
    member_profile = repository.get_member_profile(current_user.id)
    role_tag = member_profile.role_tag if member_profile else None
    viewer = _serialize_viewer_context(repository, current_user)
    review = repository.create_review(
        payload=payload,
        user=current_user,
        display_name=viewer.profile.display_name,
        role_title=role_tag,
    )
    return _build_review_read(repository, review)


@router.get("/admin/context", response_model=CommunityAdminContextRead)
def get_admin_context(
    repository: Annotated[CommunityRepository, Depends(get_community_repository)] = None,
    current_user=Depends(get_current_user),
) -> CommunityAdminContextRead:
    _require_community_admin(repository, current_user)
    profiles = repository.list_profiles_for_users([current_user.id])
    member_profiles = repository.list_member_profiles_for_users([current_user.id])
    return CommunityAdminContextRead(
        profile=_serialize_member(
            repository=repository,
            user=current_user,
            profiles=profiles,
            member_profiles=member_profiles,
        )
    )


@router.get("/admin/members", response_model=CommunityMemberListResponse)
def list_admin_members(
    query: str | None = None,
    repository: Annotated[CommunityRepository, Depends(get_community_repository)] = None,
    current_user=Depends(get_current_user),
) -> CommunityMemberListResponse:
    _require_community_admin(repository, current_user)
    users = repository.list_member_users(query=query)
    user_ids = [user.id for user in users]
    profiles = repository.list_profiles_for_users(user_ids)
    member_profiles = repository.list_member_profiles_for_users(user_ids)
    return CommunityMemberListResponse(
        items=[
            _serialize_member(
                repository=repository,
                user=user,
                profiles=profiles,
                member_profiles=member_profiles,
            )
            for user in users
        ]
    )


@router.put("/admin/members/{user_id}", response_model=CommunityMemberProfileRead)
def update_member(
    user_id: str,
    payload: CommunityMemberProfileUpdate,
    repository: Annotated[CommunityRepository, Depends(get_community_repository)] = None,
    current_user=Depends(get_current_user),
) -> CommunityMemberProfileRead:
    _require_community_admin(repository, current_user)
    target_user = repository.get_user(user_id)
    if target_user is None:
        raise AppError("community_member_not_found", "Пользователь не найден.", 404)
    repository.update_member_profile(
        target_user=target_user,
        is_verified=payload.is_verified,
        role_tag=payload.role_tag,
        is_admin=payload.is_admin,
    )
    profiles = repository.list_profiles_for_users([target_user.id])
    member_profiles = repository.list_member_profiles_for_users([target_user.id])
    return _serialize_member(
        repository=repository,
        user=target_user,
        profiles=profiles,
        member_profiles=member_profiles,
    )


@router.delete("/admin/discussions/{discussion_id}", response_model=CommunityMessageResponse)
def delete_discussion(
    discussion_id: str,
    repository: Annotated[CommunityRepository, Depends(get_community_repository)] = None,
    current_user=Depends(get_current_user),
) -> CommunityMessageResponse:
    _require_community_admin(repository, current_user)
    discussion = repository.get_discussion(discussion_id)
    if discussion is None:
        raise AppError("community_discussion_not_found", "Обсуждение не найдено.", 404)
    repository.delete_discussion(discussion)
    return CommunityMessageResponse(message="Обсуждение удалено.")


@router.delete("/admin/comments/{comment_id}", response_model=CommunityMessageResponse)
def delete_comment(
    comment_id: str,
    repository: Annotated[CommunityRepository, Depends(get_community_repository)] = None,
    current_user=Depends(get_current_user),
) -> CommunityMessageResponse:
    _require_community_admin(repository, current_user)
    comment = repository.get_comment(comment_id)
    if comment is None:
        raise AppError("community_comment_not_found", "Комментарий не найден.", 404)
    repository.delete_comment(comment)
    return CommunityMessageResponse(message="Комментарий удалён.")


@router.delete("/admin/reviews/{review_id}", response_model=CommunityMessageResponse)
def delete_review(
    review_id: str,
    repository: Annotated[CommunityRepository, Depends(get_community_repository)] = None,
    current_user=Depends(get_current_user),
) -> CommunityMessageResponse:
    _require_community_admin(repository, current_user)
    review = repository.get_review(review_id)
    if review is None:
        raise AppError("community_review_not_found", "Отзыв не найден.", 404)
    repository.delete_review(review)
    return CommunityMessageResponse(message="Отзыв удалён.")


@router.get("/admin/publications", response_model=CommunityPublicationAdminListResponse)
def list_publications_admin(
    repository: Annotated[CommunityRepository, Depends(get_community_repository)] = None,
    current_user=Depends(get_current_user),
) -> CommunityPublicationAdminListResponse:
    _require_community_admin(repository, current_user)
    return CommunityPublicationAdminListResponse(
        items=[_serialize_publication(item) for item in repository.list_publications_admin()]
    )


@router.post("/admin/publications", response_model=CommunityPublicationAdminRead, status_code=status.HTTP_201_CREATED)
def create_publication(
    payload: CommunityPublicationAdminWrite,
    repository: Annotated[CommunityRepository, Depends(get_community_repository)] = None,
    current_user=Depends(get_current_user),
) -> CommunityPublicationAdminRead:
    _require_community_admin(repository, current_user)
    return _serialize_publication(
        repository.save_publication(publication=None, payload=payload)
    )


@router.put("/admin/publications/{publication_id}", response_model=CommunityPublicationAdminRead)
def update_publication(
    publication_id: str,
    payload: CommunityPublicationAdminWrite,
    repository: Annotated[CommunityRepository, Depends(get_community_repository)] = None,
    current_user=Depends(get_current_user),
) -> CommunityPublicationAdminRead:
    _require_community_admin(repository, current_user)
    publication = repository.get_publication_admin(publication_id)
    if publication is None:
        raise AppError("community_publication_not_found", "Публикация не найдена.", 404)
    return _serialize_publication(
        repository.save_publication(publication=publication, payload=payload)
    )


@router.delete("/admin/publications/{publication_id}", response_model=CommunityMessageResponse)
def delete_publication(
    publication_id: str,
    repository: Annotated[CommunityRepository, Depends(get_community_repository)] = None,
    current_user=Depends(get_current_user),
) -> CommunityMessageResponse:
    _require_community_admin(repository, current_user)
    publication = repository.get_publication_admin(publication_id)
    if publication is None:
        raise AppError("community_publication_not_found", "Публикация не найдена.", 404)
    repository.delete_publication(publication)
    return CommunityMessageResponse(message="Публикация удалена.")
