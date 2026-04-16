from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domains.community.models import CommunityComment, CommunityDiscussion, CommunityReview


class CommunityRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_discussions(self, *, product: str | None = None, category: str | None = None) -> list[CommunityDiscussion]:
        statement = select(CommunityDiscussion).order_by(CommunityDiscussion.created_at.desc())
        if product is not None:
            statement = statement.where(CommunityDiscussion.product == product)
        if category is not None:
            statement = statement.where(CommunityDiscussion.category == category)
        return list(self.db.scalars(statement).all())

    def get_discussion(self, discussion_id: str) -> CommunityDiscussion | None:
        statement = select(CommunityDiscussion).where(CommunityDiscussion.id == discussion_id)
        return self.db.scalar(statement)

    def create_discussion(self, payload) -> CommunityDiscussion:
        discussion = CommunityDiscussion(
            product=payload.product,
            category=payload.category,
            author_name=payload.author_name,
            title=payload.title,
            body=payload.body,
        )
        self.db.add(discussion)
        self.db.commit()
        self.db.refresh(discussion)
        return discussion

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

    def create_comment(self, *, discussion: CommunityDiscussion, payload) -> CommunityComment:
        comment = CommunityComment(
            discussion_id=discussion.id,
            parent_id=payload.parent_id,
            author_name=payload.author_name,
            body=payload.body,
        )
        discussion.comment_count += 1
        self.db.add(comment)
        self.db.add(discussion)
        self.db.commit()
        self.db.refresh(comment)
        return comment

    def react_comment(self, *, comment: CommunityComment, reaction: str) -> CommunityComment:
        if reaction == "like":
            comment.like_count += 1
        else:
            comment.dislike_count += 1
        self.db.add(comment)
        self.db.commit()
        self.db.refresh(comment)
        return comment

    def list_reviews(self, *, product: str | None = None) -> list[CommunityReview]:
        statement = select(CommunityReview).order_by(CommunityReview.created_at.desc())
        if product is not None:
            statement = statement.where(CommunityReview.product == product)
        return list(self.db.scalars(statement).all())

    def create_review(self, payload) -> CommunityReview:
        review = CommunityReview(
            product=payload.product,
            author_name=payload.author_name,
            role_title=payload.role_title,
            rating=payload.rating,
            advantages=payload.advantages,
            disadvantages=payload.disadvantages,
            body=payload.body,
        )
        self.db.add(review)
        self.db.commit()
        self.db.refresh(review)
        return review
