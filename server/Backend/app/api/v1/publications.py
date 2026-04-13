from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_publication_repository
from app.core.exceptions import AppError
from app.domains.publications.repository import PublicationRepository
from app.domains.publications.schemas import (
    PublicationDetailRead,
    PublicationListItemRead,
    PublicationListResponse,
)
from app.shared.enums import PublicationCategory

router = APIRouter(prefix="/public/publications", tags=["publications"])


@router.get("", response_model=PublicationListResponse)
def list_publications(
    category: Annotated[PublicationCategory | None, Query()] = None,
    repository: Annotated[PublicationRepository, Depends(get_publication_repository)] = None,
) -> PublicationListResponse:
    items = [
        PublicationListItemRead.model_validate(item, from_attributes=True)
        for item in repository.list_publications(category=category)
    ]
    return PublicationListResponse(items=items)


@router.get("/{slug}", response_model=PublicationDetailRead)
def get_publication(
    slug: str,
    repository: Annotated[PublicationRepository, Depends(get_publication_repository)] = None,
) -> PublicationDetailRead:
    publication = repository.get_publication_by_slug(slug)
    if publication is None:
        raise AppError("publication_not_found", "Публикация не найдена.", 404)
    return PublicationDetailRead.model_validate(publication, from_attributes=True)
