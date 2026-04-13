import { LayoutGrid, List } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UPDATE_CATEGORIES } from "../site-content";
import {
  listPublications,
  type PublicPublicationCategory,
  type PublicPublicationListItem,
} from "../api";

type UpdatesView = "grid" | "list";

const CATEGORY_MAP: Record<(typeof UPDATE_CATEGORIES)[number], PublicPublicationCategory | undefined> = {
  Все: undefined,
  Публикации: "publication",
  Анонсы: "announcement",
  Интеграции: "integration",
  Релиз: "release",
};

export function NeriorUpdatesPage() {
  const [activeCategory, setActiveCategory] =
    useState<(typeof UPDATE_CATEGORIES)[number]>("Все");
  const [view, setView] = useState<UpdatesView>("grid");
  const [items, setItems] = useState<PublicPublicationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await listPublications(CATEGORY_MAP[activeCategory]);
        if (!cancelled) {
          setItems(response);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить публикации.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [activeCategory]);

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
          {isLoading ? (
            <article className="public-empty-state">
              <span className="public-eyebrow">Обновления</span>
              <h2>Загрузка публикаций...</h2>
            </article>
          ) : error ? (
            <article className="public-empty-state">
              <span className="public-eyebrow">Ошибка</span>
              <h2>Не удалось получить публикации.</h2>
              <p>{error}</p>
            </article>
          ) : items.length === 0 ? (
            <article className="public-empty-state">
              <span className="public-eyebrow">Нет публикаций</span>
              <h2>Статьи ещё не загружены.</h2>
              <p>
                Страница уже подключена к реальному backend API. Контент будет добавлен позже
                через базу данных без моков.
              </p>
            </article>
          ) : view === "grid" ? (
            items.map((item) => (
              <Link key={item.id} to={`/updates/${item.slug}`} className="public-update-card">
                <div className="public-update-card__media">
                  {item.preview_image_url ? (
                    <img src={item.preview_image_url} alt={item.title} />
                  ) : (
                    <div className="public-update-card__placeholder" />
                  )}
                </div>
                <div className="public-update-card__body">
                  <h2>{item.title}</h2>
                  <p>{item.summary}</p>
                </div>
              </Link>
            ))
          ) : (
            items.map((item) => (
              <Link key={item.id} to={`/updates/${item.slug}`} className="public-update-row">
                <div className="public-update-row__meta">
                  <span>{item.category}</span>
                  <small>{item.published_at ?? "Дата будет добавлена"}</small>
                </div>
                <div className="public-update-row__body">
                  <h2>{item.title}</h2>
                  <p>{item.summary}</p>
                </div>
              </Link>
            ))
          )}
        </section>
      </section>
    </main>
  );
}
