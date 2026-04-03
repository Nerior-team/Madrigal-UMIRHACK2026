from dataclasses import dataclass

from app.domains.commands.schemas import MachineCommandTemplateParameterRead
from app.shared.enums import CommandParameterType, CommandRunner, OperatingSystemFamily, ResultParserKind


@dataclass(frozen=True, slots=True)
class BuiltinTemplateDefinition:
    template_key: str
    name: str
    description: str
    parser_kind: ResultParserKind

    def runner_for(self, os_family: OperatingSystemFamily) -> CommandRunner:
        if os_family == OperatingSystemFamily.WINDOWS:
            return CommandRunner.POWERSHELL
        return CommandRunner.SHELL

    def parameters_for(self) -> list[MachineCommandTemplateParameterRead]:
        return []

    def render(self, os_family: OperatingSystemFamily) -> str:
        match self.template_key:
            case "system:basic_diagnostics":
                if os_family == OperatingSystemFamily.WINDOWS:
                    return "Get-ComputerInfo | Select-Object CsName,WindowsProductName,WindowsVersion | ConvertTo-Json -Compress"
                return "uname -a"
            case "system:disk_usage":
                if os_family == OperatingSystemFamily.WINDOWS:
                    return "Get-PSDrive -PSProvider FileSystem | Select-Object Name,Used,Free | ConvertTo-Json -Compress"
                return "df -h"
            case "system:network_context":
                if os_family == OperatingSystemFamily.WINDOWS:
                    return "Get-NetIPConfiguration | ConvertTo-Json -Compress"
                return "ip addr"
            case "system:memory_usage":
                if os_family == OperatingSystemFamily.WINDOWS:
                    return "Get-CimInstance Win32_OperatingSystem | Select-Object TotalVisibleMemorySize,FreePhysicalMemory | ConvertTo-Json -Compress"
                return "free -h"
            case _:
                raise KeyError(self.template_key)


BUILTIN_TEMPLATES: tuple[BuiltinTemplateDefinition, ...] = (
    BuiltinTemplateDefinition(
        template_key="system:basic_diagnostics",
        name="Basic diagnostics",
        description="Базовая диагностика узла.",
        parser_kind=ResultParserKind.BASIC_DIAGNOSTICS,
    ),
    BuiltinTemplateDefinition(
        template_key="system:disk_usage",
        name="Disk usage",
        description="Сбор информации по файловым системам.",
        parser_kind=ResultParserKind.DISK_USAGE,
    ),
    BuiltinTemplateDefinition(
        template_key="system:network_context",
        name="Network context",
        description="Сбор сетевого контекста машины.",
        parser_kind=ResultParserKind.NETWORK_CONTEXT,
    ),
    BuiltinTemplateDefinition(
        template_key="system:memory_usage",
        name="Memory usage",
        description="Сбор информации по памяти.",
        parser_kind=ResultParserKind.MEMORY_USAGE,
    ),
)


def get_builtin_template(template_key: str) -> BuiltinTemplateDefinition | None:
    for definition in BUILTIN_TEMPLATES:
        if definition.template_key == template_key:
            return definition
    return None


def list_builtin_templates() -> tuple[BuiltinTemplateDefinition, ...]:
    return BUILTIN_TEMPLATES
