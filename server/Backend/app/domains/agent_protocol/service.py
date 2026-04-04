from hashlib import sha256

from app.domains.commands.repository import CommandRepository
from app.domains.agent_protocol.schemas import (
    AgentHeartbeatAck,
    AgentIdentityResponse,
    AgentRegistrationCompleteResponse,
    AgentRegistrationStartResponse,
    AgentUnpairResponse,
)
from app.domains.machines.schemas import MachineHeartbeatRequest, MachineRegistrationCompleteRequest, MachineRegistrationStartRequest
from app.domains.machines.service import MachineService
from app.shared.enums import CommandRunner, OperatingSystemFamily


class AgentProtocolService:
    def __init__(self, machine_service: MachineService, command_repository: CommandRepository | None = None) -> None:
        self.machine_service = machine_service
        self.command_repository = command_repository

    def _allowed_runners_for_machine(self, *, os_family: OperatingSystemFamily) -> list[CommandRunner]:
        if os_family == OperatingSystemFamily.WINDOWS:
            return [CommandRunner.POWERSHELL]
        if os_family in {OperatingSystemFamily.LINUX, OperatingSystemFamily.MACOS}:
            return [CommandRunner.SHELL]
        return []

    def _build_config_fingerprint(self, machine) -> str:
        custom_templates = self.command_repository.list_machine_templates(machine.id) if self.command_repository else []
        allowed_runners = self._allowed_runners_for_machine(os_family=machine.os_family)
        payload = [
            machine.id,
            machine.os_family.value,
            str(machine.concurrency_limit),
            ",".join(runner.value for runner in allowed_runners),
            str(len(custom_templates)),
        ]
        for template in custom_templates:
            payload.extend(
                [
                    template.template_key,
                    template.runner.value,
                    str(template.is_enabled),
                    template.updated_at.isoformat() if template.updated_at else "",
                ]
            )
        return sha256("|".join(payload).encode("utf-8")).hexdigest()

    def start_registration(self, payload: MachineRegistrationStartRequest) -> AgentRegistrationStartResponse:
        response = self.machine_service.start_registration(payload=payload)
        return AgentRegistrationStartResponse(**response.model_dump())

    def complete_registration(self, *, registration_id: str, payload: MachineRegistrationCompleteRequest, client) -> AgentRegistrationCompleteResponse:
        response = self.machine_service.complete_registration(
            registration_id=registration_id,
            payload=payload,
            client=client,
        )
        return AgentRegistrationCompleteResponse(**response.model_dump())

    def heartbeat(self, *, machine_token: str, payload: MachineHeartbeatRequest, client) -> AgentHeartbeatAck:
        response = self.machine_service.apply_heartbeat(machine_token=machine_token, payload=payload, client=client)
        return AgentHeartbeatAck(**response.model_dump())

    def me(self, *, machine_token: str) -> AgentIdentityResponse:
        machine = self.machine_service.get_agent_identity(machine_token=machine_token)
        allowed_runners = self._allowed_runners_for_machine(os_family=machine.os_family)
        return AgentIdentityResponse(
            machine_id=machine.id,
            display_name=machine.display_name,
            hostname=machine.hostname,
            os_family=machine.os_family,
            os_version=machine.os_version,
            status=machine.status,
            concurrency_limit=machine.concurrency_limit,
            last_heartbeat_at=machine.last_heartbeat_at,
            allowed_runners=allowed_runners,
            config_fingerprint=self._build_config_fingerprint(machine),
        )

    def unpair(self, *, machine_token: str, client) -> AgentUnpairResponse:
        machine_id = self.machine_service.unpair_machine(machine_token=machine_token, client=client)
        return AgentUnpairResponse(machine_id=machine_id, message="Machine unpaired")
