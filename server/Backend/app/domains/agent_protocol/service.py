from app.domains.agent_protocol.schemas import (
    AgentHeartbeatAck,
    AgentIdentityResponse,
    AgentRegistrationCompleteResponse,
    AgentRegistrationStartResponse,
    AgentUnpairResponse,
)
from app.domains.machines.schemas import MachineHeartbeatRequest, MachineRegistrationCompleteRequest, MachineRegistrationStartRequest
from app.domains.machines.service import MachineService


class AgentProtocolService:
    def __init__(self, machine_service: MachineService) -> None:
        self.machine_service = machine_service

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
        return AgentIdentityResponse(
            machine_id=machine.id,
            display_name=machine.display_name,
            hostname=machine.hostname,
            os_family=machine.os_family,
            os_version=machine.os_version,
            status=machine.status,
            concurrency_limit=machine.concurrency_limit,
            last_heartbeat_at=machine.last_heartbeat_at,
        )

    def unpair(self, *, machine_token: str, client) -> AgentUnpairResponse:
        machine_id = self.machine_service.unpair_machine(machine_token=machine_token, client=client)
        return AgentUnpairResponse(machine_id=machine_id, message="Machine unpaired")
