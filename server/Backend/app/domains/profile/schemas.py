from pydantic import BaseModel, ConfigDict, Field

from app.shared.enums import DeletedMachineRetention


class UserProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    first_name: str
    last_name: str
    full_name: str
    avatar_data_url: str | None = None
    deleted_machine_retention: DeletedMachineRetention


class UserProfileUpdateRequest(BaseModel):
    first_name: str = Field(default="", max_length=120)
    last_name: str = Field(default="", max_length=120)
    avatar_data_url: str | None = Field(default=None, max_length=1_500_000)
    deleted_machine_retention: DeletedMachineRetention = DeletedMachineRetention.MONTH
