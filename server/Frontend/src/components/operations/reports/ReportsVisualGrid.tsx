import type {
  ReportLoadRow,
  ReportSummaryRow,
  ReportTimelinePoint,
  ReportsStats,
} from "./types";

type ReportsVisualGridProps = {
  stats: ReportsStats;
  templateRows: ReportSummaryRow[];
  machineRows: ReportLoadRow[];
  timeline: ReportTimelinePoint[];
};

export function ReportsVisualGrid({
  stats,
  templateRows,
  machineRows,
  timeline,
}: ReportsVisualGridProps) {
  const successRateValue = Number.isFinite(stats.successRate)
    ? stats.successRate
    : 0;
  const errorRateValue = stats.totalTasks
    ? Math.min(100, (stats.errorTasks / stats.totalTasks) * 100)
    : 0;
  const topTemplateRows = templateRows.slice(0, 5);
  const templateMax = Math.max(1, ...topTemplateRows.map((row) => row.totalTasks));
  const machineMax = Math.max(1, ...machineRows.map((row) => row.totalTasks));
  const timelineMax = Math.max(1, ...timeline.map((point) => point.totalTasks));

  return (
    <div className="reports-visual-grid reports-visual-grid--enhanced">
      <section className="reports-visual-card">
        <header className="reports-visual-card__header">
          <strong>Коэффициент успеха</strong>
          <span>По текущей выборке</span>
        </header>
        <div className="reports-visual-card__content reports-visual-card__content--donut">
          <div
            className="reports-donut"
            style={{
              background: `conic-gradient(#3bc405 0 ${successRateValue}%, #ed3030 ${successRateValue}% 100%)`,
            }}
            aria-hidden="true"
          >
            <div className="reports-donut__inner">
              <strong>{`${successRateValue.toFixed(1)}%`}</strong>
              <span>Успешно</span>
            </div>
          </div>

          <div className="reports-donut-legend">
            <p>
              <span className="reports-donut-legend__dot reports-donut-legend__dot--success" />
              {`Завершено: ${stats.completedTasks}`}
            </p>
            <p>
              <span className="reports-donut-legend__dot reports-donut-legend__dot--error" />
              {`Ошибок: ${stats.errorTasks}`}
            </p>
          </div>
        </div>
      </section>

      <section className="reports-visual-card">
        <header className="reports-visual-card__header">
          <strong>Активность по времени</strong>
          <span>Число запусков по текущему периоду</span>
        </header>
        <div className="reports-timeline">
          {timeline.length ? (
            timeline.map((point) => {
              const height = Math.max(
                10,
                Math.round((point.totalTasks / timelineMax) * 100),
              );
              return (
                <article key={point.id} className="reports-timeline__item">
                  <div className="reports-timeline__bars" aria-hidden="true">
                    <span
                      className="reports-timeline__bar reports-timeline__bar--total"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <strong>{point.totalTasks}</strong>
                  <span>{point.label}</span>
                </article>
              );
            })
          ) : (
            <p className="reports-bars__empty">Данных для активности пока нет.</p>
          )}
        </div>
      </section>

      <section className="reports-visual-card">
        <header className="reports-visual-card__header">
          <strong>Нагрузка по шаблонам</strong>
          <span>Топ-5 по числу запусков</span>
        </header>
        <div className="reports-bars">
          {topTemplateRows.length ? (
            topTemplateRows.map((row) => {
              const percent = Math.max(
                8,
                Math.round((row.totalTasks / templateMax) * 100),
              );
              return (
                <article key={row.id} className="reports-bars__row">
                  <div className="reports-bars__label">
                    <strong>{row.title}</strong>
                    <span>{`${row.totalTasks} задач`}</span>
                  </div>
                  <div className="reports-bars__track">
                    <div className="reports-bars__fill" style={{ width: `${percent}%` }} />
                  </div>
                </article>
              );
            })
          ) : (
            <p className="reports-bars__empty">Данных по шаблонам пока нет.</p>
          )}
        </div>
      </section>

      <section className="reports-visual-card">
        <header className="reports-visual-card__header">
          <strong>Топ машин</strong>
          <span>Нагрузка и доля успешных запусков</span>
        </header>
        <div className="reports-load-list">
          {machineRows.length ? (
            machineRows.map((row) => {
              const percent = Math.max(
                8,
                Math.round((row.totalTasks / machineMax) * 100),
              );
              return (
                <article key={row.id} className="reports-load-list__row">
                  <div className="reports-load-list__meta">
                    <strong>{row.label}</strong>
                    <span>{`${row.totalTasks} задач · ${row.successRate}% success`}</span>
                  </div>
                  <div className="reports-bars__track">
                    <div className="reports-bars__fill" style={{ width: `${percent}%` }} />
                  </div>
                </article>
              );
            })
          ) : (
            <p className="reports-bars__empty">Нет активных машин в текущей выборке.</p>
          )}
        </div>
      </section>

      <section className="reports-visual-card reports-visual-card--wide">
        <header className="reports-visual-card__header">
          <strong>Ошибки против общего потока</strong>
          <span>Отношение ошибок к числу задач</span>
        </header>
        <div className="reports-visual-card__content reports-visual-card__content--progress">
          <div className="reports-progress">
            <div className="reports-progress__track">
              <div
                className="reports-progress__fill"
                style={{ width: `${Math.max(2, errorRateValue)}%` }}
              />
            </div>
            <div className="reports-progress__meta">
              <strong>{`${errorRateValue.toFixed(1)}%`}</strong>
              <span>{`Ошибок: ${stats.errorTasks} из ${stats.totalTasks}`}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
