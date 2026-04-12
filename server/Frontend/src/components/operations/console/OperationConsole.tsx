import type { ReactNode } from "react";

export type OperationConsoleLineTone =
  | "command"
  | "stdout"
  | "stderr"
  | "system";

export type OperationConsoleLine = {
  id: string;
  tone: OperationConsoleLineTone;
  text: string;
  timestamp?: string;
  label?: string;
};

export type OperationConsoleBlock = {
  id: string;
  title: string;
  text: string;
  tone?: "default" | "danger";
};

type OperationConsoleProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  lines?: OperationConsoleLine[];
  blocks?: OperationConsoleBlock[];
  emptyMessage: string;
  ariaLabel?: string;
  live?: boolean;
};

function getLineLabel(line: OperationConsoleLine): string {
  if (line.label?.trim()) return line.label.trim();
  if (line.tone === "command") return "$";
  if (line.tone === "stderr") return "stderr";
  if (line.tone === "system") return "system";
  return "stdout";
}

export function OperationConsole({
  title,
  subtitle,
  actions,
  lines = [],
  blocks = [],
  emptyMessage,
  ariaLabel,
  live = false,
}: OperationConsoleProps) {
  const hasContent = lines.length > 0 || blocks.length > 0;

  return (
    <section className="operation-console" aria-label={ariaLabel ?? title}>
      <div className="operation-console__header">
        <div className="operation-console__header-copy">
          <span>{title}</span>
          {subtitle ? <strong>{subtitle}</strong> : null}
        </div>
        {actions ? (
          <div className="operation-console__header-actions">{actions}</div>
        ) : null}
      </div>

      <div
        className="operation-console__body"
        role={live ? "log" : undefined}
        aria-live={live ? "polite" : undefined}
      >
        {hasContent ? (
          <>
            {lines.map((line) => (
              <div
                key={line.id}
                className={`operation-console__line operation-console__line--${line.tone}`}
              >
                {line.timestamp ? (
                  <span className="operation-console__timestamp">
                    {line.timestamp}
                  </span>
                ) : null}
                <span className="operation-console__channel">
                  {getLineLabel(line)}
                </span>
                <span className="operation-console__text">{line.text}</span>
              </div>
            ))}

            {blocks.map((block) => (
              <div key={block.id} className="operation-console__block">
                <p className="operation-console__block-title">{block.title}</p>
                <pre
                  className={
                    block.tone === "danger"
                      ? "operation-console__output operation-console__output--danger"
                      : "operation-console__output"
                  }
                >
                  {block.text}
                </pre>
              </div>
            ))}
          </>
        ) : (
          <div className="operation-console__line operation-console__line--system">
            <span className="operation-console__channel">system</span>
            <span className="operation-console__text">{emptyMessage}</span>
          </div>
        )}
      </div>
    </section>
  );
}
