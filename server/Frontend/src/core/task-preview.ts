const PLACEHOLDER_PATTERN = /{([a-zA-Z_][a-zA-Z0-9_]*)}/g;

export function renderTaskCommand(
  commandPattern: string,
  params: Record<string, string>,
): string {
  return commandPattern.replace(PLACEHOLDER_PATTERN, (_, key: string) => {
    return params[key] ?? "";
  });
}

export function buildTaskPreview(input: {
  commandPattern: string;
  params: Record<string, string>;
  useSudo: boolean;
}): string {
  const renderedCommand = renderTaskCommand(input.commandPattern, input.params)
    .replace(/\s+/g, " ")
    .trim();

  if (!renderedCommand) {
    return "";
  }

  return input.useSudo ? `sudo ${renderedCommand}` : renderedCommand;
}

export function getTaskPreviewShellLabel(osLabel: string): "Bash" | "Shell" {
  return /^linux\b/i.test(osLabel.trim()) ? "Bash" : "Shell";
}
