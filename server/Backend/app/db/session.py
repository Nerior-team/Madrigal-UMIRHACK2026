from sqlalchemy import create_engine

from app.core.config import get_settings


def build_database_url() -> str:
    settings = get_settings()
    return (
        f"postgresql+psycopg://{settings.postgres_user}:{settings.postgres_password}"
        f"@{settings.postgres_host}:{settings.postgres_port}/{settings.postgres_db}"
    )


engine = create_engine(build_database_url(), future=True, pool_pre_ping=True)
