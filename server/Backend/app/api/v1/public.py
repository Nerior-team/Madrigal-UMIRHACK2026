from fastapi import APIRouter, status

from app.domains.public_contact import (
    PublicContactRequest,
    PublicContactResponse,
    PublicContactService,
)

router = APIRouter(prefix="/public", tags=["public"])


@router.post("/contact", response_model=PublicContactResponse, status_code=status.HTTP_202_ACCEPTED)
def submit_contact(payload: PublicContactRequest) -> PublicContactResponse:
    return PublicContactService().submit(payload)
