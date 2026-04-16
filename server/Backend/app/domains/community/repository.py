from dataclasses import dataclass

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.domains.community.models import (
    CommunityComment,
    CommunityCommentReaction,
    CommunityDiscussion,
    CommunityDiscussionReaction,
    CommunityMemberProfile,
    CommunityReview,
)
from app.domains.profile.models import UserProfile
from app.domains.profile.service import build_full_name
from app.domains.publications.models import Publication
from app.domains.users.models import User


@dataclass(slots=True)
class CommunityAuthorSnapshot:
    user_id: str | None
    display_name: str
    email: str | None
    avatar_data_url: str | None
    is_verified: bool
    role_tag: str | None
    is_admin: bool


class CommunityRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def _root_admin_email(self) -> str:
        return get_settings().community_root_admin_email.strip().lower()

    def is_root_admin(self, user: User) -> bool:
        return user.email.strip().lower() == self._root_admin_email()

    def get_member_profile(self, user_id: str) -> CommunityMemberProfile | None:
        return self.db.get(CommunityMemberProfile, user_id)

    def get_or_create_member_profile(self, user_id: str) -> CommunityMemberProfile:
        profile = self.get_member_profile(user_id)
        if profile is not None:
            return profile
        profile = CommunityMemberProfile(user_id=user_id)
        self.db.add(profile)
        self.db.flush()
        return profile

    def get_user(self, user_id: str) -> User | None:
        return self.db.get(User, user_id)

    def get_user_by_email(self, email: str) -> User | None:
        statement = select(User).where(User.email == email.strip().lower())
        return self.db.scalar(statement)

    def list_member_users(self, query: str | None = None) -> list[User]:
        statement = select(User).order_by(User.email.asc())
        if query:
            pattern = f"%{query.strip().lower()}%"
            statement = statement.where(User.email.ilike(pattern))
        return list(self.db.scalars(statement).all())

    def list_profiles_for_users(self, user_ids: list[str]) -> dict[str, UserProfile]:
        if not user_ids:
            return {}
        statement = select(UserProfile).where(UserProfile.user_id.in_(user_ids))
        return {item.user_id: item for item in self.db.scalars(statement).all()}

    def list_member_profiles_for_users(self, user_ids: list[str]) -> dict[str, CommunityMemberProfile]:
        if not user_ids:
            return {}
        statement = select(CommunityMemberProfile).where(CommunityMemberProfile.user_id.in_(user_ids))
        return {item.user_id: item for item in self.db.scalars(statement).all()}

    def build_author_snapshot(
        self,
        *,
        user_id: str | None,
        fallback_name: str,
        users: dict[str, User],
        profiles: dict[str, UserProfile],
        member_profiles: dict[str, CommunityMemberProfile],
    ) -> CommunityAuthorSnapshot:
        if user_id and user_id in users:
            user = users[user_id]
            profile = profiles.get(user_id)
            member_profile = member_profiles.get(user_id)
            display_name = build_full_name(
                first_name=profile.first_name if profile else "",
                last_name=profile.last_name if profile else "",
                fallback_email=user.email,
            )
            return CommunityAuthorSnapshot(
                user_id=user.id,
                display_name=display_name,
                email=user.email,
                avatar_data_url=profile.avatar_data_url if profile else None,
                is_verified=bool(member_profile.is_verified) if member_profile else False,
                role_tag=member_profile.role_tag if member_profile else None,
                is_admin=self.is_root_admin(user) or (bool(member_profile.is_admin) if member_profile else False),
            )

        return CommunityAuthorSnapshot(
            user_id=None,
            display_name=fallback_name,
            email=None,
            avatar_data_url=None,
            is_verified=False,
            role_tag=None,
            is_admin=False,
        )

    def update_member_profile(self, *, target_user: User, is_verified: bool, role_tag: str | None, is_admin: bool) -> CommunityMemberProfile:
        profile = self.get_or_create_member_profile(target_user.id)
        profile.is_verified = is_verified
        profile.role_tag = role_tag.strip() if role_tag else None
        if not self.is_root_admin(target_user):
            profile.is_admin = is_admin
        self.db.add(profile)
        self.db.commit()
        self.db.refresh(profile)
        return profile

    def list_discussions(
        self,
        *,
        product: str | None = None,
        category: str | None = None,
        search: str | None = None,
    ) -> list[CommunityDiscussion]:
        statement = select(CommunityDiscussion).order_by(CommunityDiscussion.created_at.desc())
        if product is not None:
            statement = statement.where(CommunityDiscussion.product == product)
        if category is not None:
            statement = statement.where(CommunityDiscussion.category == category)
        if search:
            pattern = f"%{search.strip()}%"
            statement = statement.where(
                or_(
                    CommunityDiscussion.title.ilike(pattern),
                    CommunityDiscussion.body.ilike(pattern),
                    CommunityDiscussion.author_name.ilike(pattern),
                )
            )
        return list(self.db.scalars(statement).all())

    def get_discussion(self, discussion_id: str) -> CommunityDiscussion | None:
        statement = select(CommunityDiscussion).where(CommunityDiscussion.id == discussion_id)
        return self.db.scalar(statement)

    def create_discussion(self, *, payload, user: User, display_name: str) -> CommunityDiscussion:
        discussion = CommunityDiscussion(
            product=payload.product,
            category=payload.category,
            author_user_id=user.id,
            author_name=display_name,
            title=payload.title,
            body=payload.body,
            image_data_url=payload.image_data_url,
        )
        self.db.add(discussion)
        self.db.commit()
        self.db.refresh(discussion)
        return discussion

    def delete_discussion(self, discussion: CommunityDiscussion) -> None:
        self.db.delete(discussion)
        self.db.commit()

    def list_discussion_reactions(self, discussion_ids: list[str], *, viewer_user_id: str | None = None) -> dict[str, str]:
        if not discussion_ids or viewer_user_id is None:
            return {}
        statement = select(CommunityDiscussionReaction).where(
            CommunityDiscussionReaction.discussion_id.in_(discussion_ids),
            CommunityDiscussionReaction.user_id == viewer_user_id,
        )
        return {item.discussion_id: item.reaction for item in self.db.scalars(statement).all()}

    def toggle_discussion_reaction(self, *, discussion: CommunityDiscussion, user: User, reaction: str) -> tuple[CommunityDiscussion, str | None]:
        statement = select(CommunityDiscussionReaction).where(
            CommunityDiscussionReaction.discussion_id == discussion.id,
            CommunityDiscussionReaction.user_id == user.id,
        )
        existing = self.db.scalar(statement)
        if existing is not None and existing.reaction == reaction:
            discussion.like_count = max(0, discussion.like_count - 1)
            self.db.delete(existing)
            active_reaction = None
        else:
            if existing is None:
                existing = CommunityDiscussionReaction(discussion_id=discussion.id, user_id=user.id, reaction=reaction)
            else:
                existing.reaction = reaction
            discussion.like_count += 1
            self.db.add(existing)
            active_reaction = reaction
        self.db.add(discussion)
        self.db.commit()
        self.db.refresh(discussion)
        return discussion, active_reaction

    def list_comments(self, *, discussion_id: str) -> list[CommunityComment]:
        statement = (
            select(CommunityComment)
            .where(CommunityComment.discussion_id == discussion_id)
            .order_by(CommunityComment.created_at.asc())
        )
        return list(self.db.scalars(statement).all())

    def get_comment(self, comment_id: str) -> CommunityComment | None:
        statement = select(CommunityComment).where(CommunityComment.id == comment_id)
        return self.db.scalar(statement)

    def create_comment(self, *, discussion: CommunityDiscussion, payload, user: User, display_name: str) -> CommunityComment:
        comment = CommunityComment(
            discussion_id=discussion.id,
            parent_id=payload.parent_id,
            author_user_id=user.id,
            author_name=display_name,
            body=payload.body,
        )
        discussion.comment_count += 1
        self.db.add(comment)
        self.db.add(discussion)
        self.db.commit()
        self.db.refresh(comment)
        return comment

    def delete_comment(self, comment: CommunityComment) -> None:
        discussion = self.get_discussion(comment.discussion_id)
        comments = self.list_comments(discussion_id=comment.discussion_id)
        descendants_by_parent: dict[str | None, list[CommunityComment]] = {}
        for item in comments:
            descendants_by_parent.setdefault(item.parent_id, []).append(item)

        removal_count = 0

        def count_branch(node_id: str) -> None:
            nonlocal removal_count
            removal_count += 1
            for child in descendants_by_parent.get(node_id, []):
                count_branch(child.id)

        count_branch(comment.id)

        if discussion is not None:
            discussion.comment_count = max(0, discussion.comment_count - removal_count)
            self.db.add(discussion)
        self.db.delete(comment)
        self.db.commit()

    def list_comment_reactions(self, comment_ids: list[str], *, viewer_user_id: str | None = None) -> dict[str, str]:
        if not comment_ids or viewer_user_id is None:
            return {}
        statement = select(CommunityCommentReaction).where(
            CommunityCommentReaction.comment_id.in_(comment_ids),
            CommunityCommentReaction.user_id == viewer_user_id,
        )
        return {item.comment_id: item.reaction for item in self.db.scalars(statement).all()}

    def toggle_comment_reaction(self, *, comment: CommunityComment, user: User, reaction: str) -> tuple[CommunityComment, str | None]:
        statement = select(CommunityCommentReaction).where(
            CommunityCommentReaction.comment_id == comment.id,
            CommunityCommentReaction.user_id == user.id,
        )
        existing = self.db.scalar(statement)
        previous = existing.reaction if existing is not None else None
        active_reaction: str | None = reaction
        if previous == reaction:
            if reaction == "like":
                comment.like_count = max(0, comment.like_count - 1)
            else:
                comment.dislike_count = max(0, comment.dislike_count - 1)
            self.db.delete(existing)
            active_reaction = None
        else:
            if previous == "like":
                comment.like_count = max(0, comment.like_count - 1)
            elif previous == "dislike":
                comment.dislike_count = max(0, comment.dislike_count - 1)

            if existing is None:
                existing = CommunityCommentReaction(comment_id=comment.id, user_id=user.id, reaction=reaction)
            else:
                existing.reaction = reaction

            if reaction == "like":
                comment.like_count += 1
            else:
                comment.dislike_count += 1
            self.db.add(existing)
        self.db.add(comment)
        self.db.commit()
        self.db.refresh(comment)
        return comment, active_reaction

    def list_reviews(self, *, product: str | None = None, sort_by: str = "newest") -> list[CommunityReview]:
        statement = select(CommunityReview)
        if product is not None:
            statement = statement.where(CommunityReview.product == product)

        if sort_by == "rating_desc":
            statement = statement.order_by(CommunityReview.rating.desc(), CommunityReview.created_at.desc())
        elif sort_by == "rating_asc":
            statement = statement.order_by(CommunityReview.rating.asc(), CommunityReview.created_at.desc())
        elif sort_by == "oldest":
            statement = statement.order_by(CommunityReview.created_at.asc())
        else:
            statement = statement.order_by(CommunityReview.created_at.desc())

        return list(self.db.scalars(statement).all())

    def get_review(self, review_id: str) -> CommunityReview | None:
        return self.db.get(CommunityReview, review_id)

    def create_review(self, *, payload, user: User, display_name: str, role_title: str | None) -> CommunityReview:
        review = CommunityReview(
            product=payload.product,
            author_user_id=user.id,
            author_name=display_name,
            role_title=role_title,
            rating=payload.rating,
            advantages=payload.advantages,
            disadvantages=payload.disadvantages,
            body=payload.body,
        )
        self.db.add(review)
        self.db.commit()
        self.db.refresh(review)
        return review

    def delete_review(self, review: CommunityReview) -> None:
        self.db.delete(review)
        self.db.commit()

    def list_publications_admin(self) -> list[Publication]:
        statement = select(Publication).order_by(Publication.updated_at.desc(), Publication.created_at.desc())
        return list(self.db.scalars(statement).all())

    def get_publication_admin(self, publication_id: str) -> Publication | None:
        return self.db.get(Publication, publication_id)

    def save_publication(self, *, publication: Publication | None, payload) -> Publication:
        entity = publication or Publication(
            slug=payload.slug,
            title=payload.title,
            summary=payload.summary,
            category=payload.category,
            status=payload.status,
            preview_image_url=payload.preview_image_url,
            preview_video_url=payload.preview_video_url,
            body_blocks=[item.model_dump() for item in payload.body_blocks],
            published_at=payload.published_at,
        )
        if publication is not None:
            entity.slug = payload.slug
            entity.title = payload.title
            entity.summary = payload.summary
            entity.category = payload.category
            entity.status = payload.status
            entity.preview_image_url = payload.preview_image_url
            entity.preview_video_url = payload.preview_video_url
            entity.body_blocks = [item.model_dump() for item in payload.body_blocks]
            entity.published_at = payload.published_at
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def delete_publication(self, publication: Publication) -> None:
        self.db.delete(publication)
        self.db.commit()
