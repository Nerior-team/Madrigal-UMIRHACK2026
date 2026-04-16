from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings


def build_database_url() -> str:
    settings = get_settings()
    return (
        f"postgresql+psycopg://{settings.postgres_user}:{settings.postgres_password}"
        f"@{settings.postgres_host}:{settings.postgres_port}/{settings.postgres_db}"
    )


engine = create_engine(build_database_url(), future=True, pool_pre_ping=True)
SessionFactory = sessionmaker(bind=engine, expire_on_commit=False, autoflush=False, autocommit=False, class_=Session)


def get_session_factory() -> sessionmaker[Session]:
    return SessionFactory


def get_db_session() -> Generator[Session, None, None]:
    session = get_session_factory()()
    try:
        yield session
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def get_engine():
    return engine


def init_database() -> None:
    from app.db.metadata import Base

    Base.metadata.create_all(bind=engine)
    with engine.begin() as connection:
        connection.execute(
            text(
                """
                ALTER TABLE community_discussions
                ADD COLUMN IF NOT EXISTS author_user_id VARCHAR(36),
                ADD COLUMN IF NOT EXISTS image_data_url TEXT,
                ADD COLUMN IF NOT EXISTS like_count INTEGER NOT NULL DEFAULT 0
                """
            )
        )
        connection.execute(
            text(
                """
                ALTER TABLE community_comments
                ADD COLUMN IF NOT EXISTS author_user_id VARCHAR(36)
                """
            )
        )
        connection.execute(
            text(
                """
                ALTER TABLE community_reviews
                ADD COLUMN IF NOT EXISTS author_user_id VARCHAR(36)
                """
            )
        )
