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
  const [activeTab, setActiveTab] = useState<(typeof UPDATE_CATEGORIES)[number]>("Все");
  const [viewMode, setViewMode] = useState<UpdatesView>("list");
  const [items, setItems] = useState<PublicPublicationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await listPublications(CATEGORY_MAP[activeTab]);
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
  }, [activeTab]);

  return (
    <main style={{ minHeight: "100vh", background: "#000", color: "#fff" }}>
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "4rem 1.75rem 0" }}>
        <h1
          style={{
            fontSize: "clamp(2.25rem, 5vw, 3.75rem)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.08,
            marginBottom: "2.5rem",
          }}
        >
          Обновления
        </h1>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: "1.25rem",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            {UPDATE_CATEGORIES.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  background: "none",
                  border: "none",
                  fontFamily: "inherit",
                  padding: 0,
                  fontSize: "0.9375rem",
                  color: tab === activeTab ? "#fff" : "rgba(255,255,255,0.4)",
                  fontWeight: tab === activeTab ? 600 : 400,
                  cursor: "pointer",
                  transition: "color 0.15s",
                  borderBottom: tab === activeTab ? "2px solid #fff" : "2px solid transparent",
                  paddingBottom: "2px",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "0.25rem" }}>
            <button
              type="button"
              title="Блоками"
              aria-label="Блоками"
              onClick={() => setViewMode("grid")}
              style={{
                background: "none",
                border: "none",
                padding: "0.25rem",
                cursor: "pointer",
                color: viewMode === "grid" ? "#fff" : "rgba(255,255,255,0.35)",
              }}
            >
              <GridIcon />
            </button>
            <button
              type="button"
              title="Списком"
              aria-label="Списком"
              onClick={() => setViewMode("list")}
              style={{
                background: "none",
                border: "none",
                padding: "0.25rem",
                cursor: "pointer",
                color: viewMode === "list" ? "#fff" : "rgba(255,255,255,0.35)",
              }}
            >
              <ListIcon />
            </button>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "3.5rem 1.75rem 8rem" }}>
        {isLoading ? (
          <EmptyState title="Загрузка публикаций..." />
        ) : error ? (
          <EmptyState title="Не удалось загрузить публикации." description={error} />
        ) : items.length === 0 ? (
          <EmptyState description="Публикации появятся здесь, когда они будут добавлены через контентный поток." />
        ) : viewMode === "list" ? (
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            {items.map((item, index) => (
              <Link
                key={item.id}
                to={`/updates/${item.slug}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "180px minmax(0, 1fr)",
                  gap: "1.5rem",
                  padding: "1.5rem 0 1.75rem",
                  borderTop: index === 0 ? "none" : "1px solid rgba(255,255,255,0.08)",
                  color: "#fff",
                  textDecoration: "none",
                }}
              >
                <div style={{ display: "grid", gap: "0.45rem", alignContent: "start" }}>
                  <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {formatCategory(item.category)}
                  </span>
                  <small style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.35)" }}>{formatPublicationDate(item.published_at)}</small>
                </div>
                <div>
                  <h2 style={{ fontSize: "1.35rem", lineHeight: 1.18, margin: "0 0 0.75rem", letterSpacing: "-0.02em" }}>{item.title}</h2>
                  <p style={{ margin: 0, fontSize: "0.9375rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.65 }}>{item.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem" }}>
            {items.map((item) => (
              <Link
                key={item.id}
                to={`/updates/${item.slug}`}
                style={{ display: "grid", gap: "0.9rem", color: "#fff", textDecoration: "none" }}
              >
                <div
                  style={{
                    aspectRatio: "1 / 1",
                    borderRadius: "12px",
                    overflow: "hidden",
                    background: item.preview_image_url
                      ? undefined
                      : "radial-gradient(circle at 82% 48%, #2d2d2d 0 1.1%, transparent 1.2%), radial-gradient(circle at 50% 50%, rgba(72,72,72,0.8) 0 8%, transparent 8.2%), linear-gradient(135deg, #efefdb, #e7e7cf)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {item.preview_image_url ? (
                    <img
                      src={item.preview_image_url}
                      alt={item.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  ) : null}
                </div>
                <div style={{ display: "grid", gap: "0.5rem" }}>
                  <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap", fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>
                    <span>{formatCategory(item.category)}</span>
                    <span>{formatPublicationDate(item.published_at)}</span>
                  </div>
                  <h2 style={{ fontSize: "1.25rem", lineHeight: 1.15, margin: 0, letterSpacing: "-0.02em" }}>{item.title}</h2>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>{item.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function EmptyState({
  title = "Публикации появятся позже.",
  description,
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "3.5rem", textAlign: "left" }}>
      <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.3)", lineHeight: 1.6, maxWidth: "480px" }}>
        {title}
      </p>
      {description ? (
        <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.65, maxWidth: "560px" }}>
          {description}
        </p>
      ) : null}
    </div>
  );
}

function GridIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <rect x="2" y="2" width="7" height="7" rx="1" />
      <rect x="11" y="2" width="7" height="7" rx="1" />
      <rect x="2" y="11" width="7" height="7" rx="1" />
      <rect x="11" y="11" width="7" height="7" rx="1" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <rect x="2" y="4" width="16" height="2" rx="1" />
      <rect x="2" y="9" width="16" height="2" rx="1" />
      <rect x="2" y="14" width="16" height="2" rx="1" />
    </svg>
  );
}
