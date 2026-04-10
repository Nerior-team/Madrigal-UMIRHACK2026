import type { ReactNode } from "react";

type ModalFrameProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function ModalFrame({
  title,
  subtitle,
  actions,
  children,
}: ModalFrameProps) {
  return (
    <section className="modal-frame" role="dialog" aria-modal="true" aria-label={title}>
      <header className="modal-frame__header">
        <div className="modal-frame__copy">
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {actions ? <div className="modal-frame__actions">{actions}</div> : null}
      </header>
      <div className="modal-frame__body">{children}</div>
    </section>
  );
}
