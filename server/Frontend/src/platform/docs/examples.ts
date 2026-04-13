import type { PlatformEndpointReference } from "./reference";

export type ExampleLanguage = "curl" | "javascript" | "python";

export const EXAMPLE_LANGUAGE_OPTIONS: Array<{
  value: ExampleLanguage;
  label: string;
}> = [
  { value: "curl", label: "cURL" },
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
];

function resolveExamplePath(endpoint: PlatformEndpointReference): string {
  return endpoint.path
    .replace("{machine_id}", "machine_123")
    .replace("{task_id}", "task_123")
    .replace("{result_id}", "result_123");
}

function buildRequestBody(endpoint: PlatformEndpointReference): string | null {
  if (endpoint.id !== "create-task") {
    return null;
  }

  return JSON.stringify(
    {
      machine_id: "machine_123",
      template_key: "system:basic_diagnostics",
      params: {
        target: "/var/log",
      },
    },
    null,
    2,
  );
}

export function buildEndpointExample(
  endpoint: PlatformEndpointReference,
  language: ExampleLanguage,
  apiBaseUrl: string,
): string {
  const url = `${apiBaseUrl}${resolveExamplePath(endpoint)}`;
  const body = buildRequestBody(endpoint);

  if (language === "curl") {
    if (!body) {
      return `curl -sS "${url}" \\\n  -H "Authorization: Bearer <api_key>"`;
    }

    return `curl -sS "${url}" \\\n  -X POST \\\n  -H "Authorization: Bearer <api_key>" \\\n  -H "Content-Type: application/json" \\\n  -d '${body.replace(/\n/g, "")}'`;
  }

  if (language === "javascript") {
    return `const response = await fetch("${url}", {\n  method: "${endpoint.method}",\n  headers: {\n    "Authorization": "Bearer <api_key>",\n${body ? '    "Content-Type": "application/json",\n' : ""}  },\n${body ? `  body: JSON.stringify(${body.replace(/\n/g, "\n  ").trim()}),\n` : ""}});\n\nconst data = await response.json();\nconsole.log(data);`;
  }

  const bodyLine = body
    ? `payload = ${body.split("\n").join("\n")}\n\nresponse = requests.${endpoint.method.toLowerCase()}(\n`
    : `response = requests.${endpoint.method.toLowerCase()}(\n`;

  return `import requests\n\nheaders = {"Authorization": "Bearer <api_key>"${body ? ', "Content-Type": "application/json"' : ""}}\n${body ? bodyLine : ""}    "${url}",\n    headers=headers${body ? ",\n    json=payload" : ""}\n)\n\nprint(response.json())`;
}
