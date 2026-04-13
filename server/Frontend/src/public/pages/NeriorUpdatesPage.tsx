import { LayoutGrid, List } from "lucide-react";
import { useState } from "react";
import { UPDATE_CATEGORIES } from "../site-content";

type UpdatesView = "grid" | "list";

export function NeriorUpdatesPage() {
  const [activeCategory, setActiveCategory] =
    useState<(typeof UPDATE_CATEGORIES)[number]>("Все");
  const [view, setView] = useState<UpdatesView>("grid");

  return (
    <main className="public-page public-page--updates">
      <section className="public-section public-section--tight">
        <div className="public-section__header public-section__header--updates">
          <div>
            <span className="public-eyebrow">Обновления</span>
            <h1>Публикации</h1>
          </div>
          <div className="public-view-toggle" aria-label="Режим отображения">
            <button
              type="button"
              className={view === "grid" ? "public-view-toggle__button is-active" : "public-view-toggle__button"}
              onClick={() => setView("grid")}
              aria-pressed={view === "grid"}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              className={view === "list" ? "public-view-toggle__button is-active" : "public-view-toggle__button"}
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        <div className="public-chip-row" role="tablist" aria-label="Категории обновлений">
          {UPDATE_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              className={category === activeCategory ? "public-chip is-active" : "public-chip"}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <section
          className={view === "grid" ? "public-updates-grid" : "public-updates-list"}
          aria-label={`Публикации: ${activeCategory}`}
        >
          <article className="public-empty-state">
            <span className="public-eyebrow">Нет публикаций</span>
            <h2>Статьи ещё не загружены.</h2>
            <p>
              Эта страница уже готова под два режима отображения. Контент будет добавлен позже
              через базу данных без моков.
            </p>
          </article>
        </section>
      </section>
    </main>
  );
}
