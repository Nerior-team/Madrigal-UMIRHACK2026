from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class PublicContactRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    interest: str = Field(pattern="^(crossplat|smart-planner|karpik|other)$")
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str = Field(min_length=6, max_length=20)
    company_name: str = Field(min_length=2, max_length=160)
    company_size: str = Field(min_length=1, max_length=8)
    message: str = Field(min_length=10, max_length=4000)

    @field_validator("phone", "company_size")
    @classmethod
    def digits_only(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized.isdigit():
            raise ValueError("must contain digits only")
        return normalized


class PublicContactResponse(BaseModel):
    status: str
    detail: str
