from app.domains.agent_protocol.schemas import AgentHeartbeatAck, AgentRegistrationCompleteResponse, AgentRegistrationStartResponse
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
