from datetime import datetime

from pydantic import BaseModel, Field

from app.domains.commands.schemas import MachineCommandTemplateRead
from app.domains.machines.schemas import MachineDetail, MachineSummary
from app.domains.results.schemas import CommandExecutionResultRead, ResultHistoryEntryRead
from app.domains.reports.schemas import ResultSummaryRead
from app.domains.tasks.schemas import TaskCreateRequest, TaskLogEntryRead, TaskRead


class TelegramLinkStatusRead(BaseModel):
    linked: bool
    telegram_user_id: str | None = None
    telegram_chat_id: str | None = None
    telegram_username: str | None = None
    telegram_first_name: str | None = None
    linked_at: datetime | None = None
    two_factor_enabled: bool
    bot_username: str


class TelegramLinkStartResponse(BaseModel):
    link_url: str
    expires_at: datetime


class TelegramLinkDeleteRequest(BaseModel):
    reauth_token: str = Field(min_length=16, max_length=512)


class TelegramTwoFactorToggleRequest(BaseModel):
    reauth_token: str = Field(min_length=16, max_length=512)


class TelegramBotStartRequest(BaseModel):
    telegram_user_id: str
    telegram_chat_id: str
    telegram_username: str | None = None
    telegram_first_name: str | None = None
    deep_link_payload: str | None = None


class TelegramBotStartResponse(BaseModel):
    linked: bool
    link_consumed: bool = False
    text: str


class TelegramBotProfileRead(BaseModel):
    email: str
    linked: bool
    telegram_username: str | None = None
    telegram_first_name: str | None = None
    linked_at: datetime | None = None
    two_factor_enabled: bool


class TelegramBotAuthPromptRead(BaseModel):
    challenge_id: str
    telegram_user_id: str
    telegram_chat_id: str
    user_email: str
    prompt_text: str
    expires_at: datetime


class TelegramBotPromptNotificationRequest(BaseModel):
    telegram_user_id: str
    telegram_chat_id: str
    message_id: int


class TelegramBotDecisionRequest(BaseModel):
    telegram_user_id: str
    telegram_chat_id: str


class TelegramBotDecisionResponse(BaseModel):
    message: str


class TelegramBotMachinesResponse(BaseModel):
    items: list[MachineSummary]


class TelegramBotMachineDetailResponse(BaseModel):
    machine: MachineDetail


class TelegramBotCommandsResponse(BaseModel):
    items: list[MachineCommandTemplateRead]


class TelegramBotTasksResponse(BaseModel):
    items: list[TaskRead]


class TelegramBotTaskDetailResponse(BaseModel):
    task: TaskRead


class TelegramBotTaskLogsResponse(BaseModel):
    items: list[TaskLogEntryRead]


class TelegramBotResultsResponse(BaseModel):
    items: list[ResultHistoryEntryRead]


class TelegramBotResultDetailResponse(BaseModel):
    result: CommandExecutionResultRead
    summary: ResultSummaryRead


class TelegramBotTaskCreateRequest(TaskCreateRequest):
    pass
