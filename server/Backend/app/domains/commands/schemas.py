from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.shared.enums import CommandParameterType, CommandRunner, ResultParserKind


class MachineCommandTemplateParameterRequest(BaseModel):
    key: str = Field(min_length=1, max_length=64, pattern=r"^[a-zA-Z_][a-zA-Z0-9_]*$")
    label: str = Field(min_length=1, max_length=128)
    type: CommandParameterType = CommandParameterType.ENUM
    allowed_values: list[str] = Field(min_length=1)


class MachineCommandTemplateCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    runner: CommandRunner
    command_pattern: str = Field(min_length=1, max_length=4000)
    parameters: list[MachineCommandTemplateParameterRequest] = Field(default_factory=list)
    parser_kind: ResultParserKind = ResultParserKind.NONE


class MachineCommandTemplateUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    runner: CommandRunner | None = None
    command_pattern: str | None = Field(default=None, min_length=1, max_length=4000)
    parameters: list[MachineCommandTemplateParameterRequest] | None = None
    parser_kind: ResultParserKind | None = None
    is_enabled: bool | None = None


class CommandTemplatesResetRequest(BaseModel):
    reauth_token: str = Field(min_length=16, max_length=512)


class MachineCommandTemplateParameterRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    key: str
    label: str
    type: CommandParameterType
    allowed_values: list[str]


class MachineCommandTemplateRead(BaseModel):
    id: str | None
    template_key: str
    name: str
    description: str | None
    runner: CommandRunner
    command_pattern: str
    parameters: list[MachineCommandTemplateParameterRead]
    parser_kind: ResultParserKind
    is_builtin: bool
    is_enabled: bool
    machine_id: str | None
    created_by_user_id: str | None
    created_at: datetime | None = None


class RenderedCommandRead(BaseModel):
    template_key: str
    template_name: str
    runner: CommandRunner
    parser_kind: ResultParserKind
    command: str
    params: dict[str, str]
    is_builtin: bool
