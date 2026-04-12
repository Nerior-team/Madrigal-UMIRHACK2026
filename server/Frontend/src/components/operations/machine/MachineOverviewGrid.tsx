import type { MachineWorkspaceMachine } from "./types";

type MachineOverviewGridProps = {
  machine: MachineWorkspaceMachine;
};

export function MachineOverviewGrid({
  machine,
}: MachineOverviewGridProps) {
  return (
    <section className="machine-details__panel">
      <div className="machine-details__overview-grid">
        <article className="machine-details__overview-card">
          <p className="machine-details__overview-label">Хост</p>
          <p className="machine-details__overview-value">{machine.hostname}</p>
        </article>

        <article className="machine-details__overview-card">
          <p className="machine-details__overview-label">Моя роль</p>
          <p className="machine-details__overview-value machine-details__overview-value--accent">
            {machine.role}
          </p>
        </article>

        <article className="machine-details__overview-card">
          <p className="machine-details__overview-label">ОС</p>
          <p className="machine-details__overview-value">{machine.os}</p>
        </article>

        <article className="machine-details__overview-card">
          <p className="machine-details__overview-label">Последняя связь</p>
          <p className="machine-details__overview-value machine-details__overview-value--heartbeat">
            {machine.heartbeat}
          </p>
        </article>

        <article className="machine-details__overview-card">
          <p className="machine-details__overview-label">Владелец</p>
          <p className="machine-details__overview-value machine-details__overview-value--accent">
            {machine.owner}
          </p>
        </article>
      </div>
    </section>
  );
}
