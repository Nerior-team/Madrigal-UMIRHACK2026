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
  Релизы: "release",
};

function formatPublicationDate(value?: string | null): string {
  if (!value) {
    return "Дата будет добавлена";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Дата будет добавлена";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Moscow",
  }).format(date);
}

function formatCategory(value: string): string {
  if (value === "publication") return "Публикация";
  if (value === "announcement") return "Анонс";
  if (value === "integration") return "Интеграция";
  if (value === "release") return "Релиз";
  return value;
}

export function NeriorUpdatesPage() {
  const [activeCategory, setActiveCategory] = useState<(typeof UPDATE_CATEGORIES)[number]>("Все");
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
      <section className="public-updates-shell">
        <div className="public-updates-header">
          <div>
            <span className="public-eyebrow">Обновления</span>
            <h1>Публикации, релизы и анонсы Nerior.</h1>
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

        <section className={view === "grid" ? "public-updates-grid" : "public-updates-list"}>
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
              <span className="public-eyebrow">Пока пусто</span>
              <h2>Публикации ещё не загружены в базу.</h2>
              <p>
                Раздел уже подключён к реальному backend API. Когда статьи появятся в системе, они автоматически
                отобразятся здесь без моков и без отдельной правки фронта.
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
                  <div className="public-update-card__meta">
                    <span>{formatCategory(item.category)}</span>
                    <small>{formatPublicationDate(item.published_at)}</small>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            items.map((item) => (
              <Link key={item.id} to={`/updates/${item.slug}`} className="public-update-row">
                <div className="public-update-row__meta">
                  <span>{formatCategory(item.category)}</span>
                  <small>{formatPublicationDate(item.published_at)}</small>
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
