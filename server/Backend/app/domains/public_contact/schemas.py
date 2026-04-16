from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


class PublicContactRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    mode: str = Field(pattern="^(client|business)$")
    interest: str = Field(pattern="^(crossplat|smart-planner|karpik|other)$")
    first_name: str = Field(min_length=2, max_length=80)
    last_name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    phone: str = Field(min_length=6, max_length=20)
    company_name: str | None = Field(default=None, max_length=160)
    company_size: str | None = Field(default=None, max_length=8)
    message: str = Field(min_length=10, max_length=4000)
    marketing: bool = False

    @field_validator("company_name", "company_size", mode="before")
    @classmethod
    def empty_string_to_none(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None

    @field_validator("phone")
    @classmethod
    def digits_only(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized.isdigit():
            raise ValueError("must contain digits only")
        return normalized

    @field_validator("company_size")
    @classmethod
    def company_size_digits_only(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        if not normalized.isdigit():
            raise ValueError("must contain digits only")
        return normalized

    @model_validator(mode="after")
    def validate_mode_fields(self) -> "PublicContactRequest":
        if self.mode == "business":
            if not self.company_name:
                raise ValueError("company_name is required for business contacts")
            if not self.company_size:
                raise ValueError("company_size is required for business contacts")
        return self


class PublicContactResponse(BaseModel):
    status: str
    detail: str
