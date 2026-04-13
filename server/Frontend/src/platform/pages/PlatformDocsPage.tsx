import { useState } from "react";
import { CustomSelect } from "../../components/primitives/CustomSelect";
import { buildEndpointExample, EXAMPLE_LANGUAGE_OPTIONS, type ExampleLanguage } from "../docs/examples";
import { PLATFORM_ENDPOINTS } from "../docs/reference";
import { PlatformSectionCard } from "../components/PlatformSectionCard";

type PlatformDocsPageProps = {
  apiBaseUrl: string;
};

export function PlatformDocsPage({ apiBaseUrl }: PlatformDocsPageProps) {
  const [language, setLanguage] = useState<ExampleLanguage>("curl");

  return (
    <div className="platform-page platform-page--docs">
      <PlatformSectionCard
        eyebrow="Authentication"
        title="Bearer API key authentication"
        detail="Developer requests use a raw API key in the Authorization header. Web sessions are only for managing keys inside the portal."
        action={
          <CustomSelect
            value={language}
            options={EXAMPLE_LANGUAGE_OPTIONS}
            onChange={(value) => setLanguage(value)}
            ariaLabel="Example language"
            className="platform-select"
          />
        }
      >
        <div className="platform-docs-summary">
          <p>Base URL</p>
          <code>{apiBaseUrl}</code>
        </div>
        <ul className="platform-list">
          <li>Use the `Authorization: Bearer &lt;api_key&gt;` header on every external request.</li>
          <li>`read` keys can inspect machines, tasks, logs, and results.</li>
          <li>`run` keys can also create tasks through `POST /tasks`.</li>
          <li>Machine scope and command scope are enforced by the backend, not by UI hints alone.</li>
        </ul>
      </PlatformSectionCard>

      <div className="platform-docs-grid">
        {PLATFORM_ENDPOINTS.map((endpoint) => (
          <PlatformSectionCard
            key={endpoint.id}
            eyebrow={endpoint.method}
            title={endpoint.title}
            detail={endpoint.summary}
          >
            <dl className="platform-endpoint-meta">
              <div>
                <dt>Path</dt>
                <dd>
                  <code>{endpoint.path}</code>
                </dd>
              </div>
              <div>
                <dt>Permission</dt>
                <dd>{endpoint.permission === "run" ? "Run" : "Read"}</dd>
              </div>
              <div>
                <dt>Auth</dt>
                <dd>{endpoint.auth}</dd>
              </div>
              <div>
                <dt>Request</dt>
                <dd>{endpoint.requestShape || "No body"}</dd>
              </div>
              <div>
                <dt>Response</dt>
                <dd>{endpoint.responseShape}</dd>
              </div>
            </dl>
            <pre className="platform-code-block">
              <code>{buildEndpointExample(endpoint, language, apiBaseUrl)}</code>
            </pre>
          </PlatformSectionCard>
        ))}
      </div>
    </div>
  );
}
