const PLACEHOLDER_PATTERN = /{([a-zA-Z_][a-zA-Z0-9_]*)}/g;

export function buildGeneratedParameterKey(index: number): string {
  return `param_${index + 1}`;
}

export function buildCommandPatternFromBase(
  commandBase: string,
  parameterKeys: string[],
): string {
  const normalizedBase = commandBase.replace(/\s+/g, " ").trim();

  return [normalizedBase, ...parameterKeys.map((key) => `{${key}}`)]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export function deriveCommandBaseFromPattern(commandPattern: string): string {
  return commandPattern.replace(PLACEHOLDER_PATTERN, " ").replace(/\s+/g, " ").trim();
}
