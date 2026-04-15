import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPublicPublication, type PublicPublicationDetail } from "../api";

function formatCategory(value: string): string {
  if (value === "publication") return "Публикация";
  if (value === "announcement") return "Анонс";
  if (value === "integration") return "Интеграция";
  if (value === "release") return "Релиз";
  return value;
}

function formatPublicationDate(value?: string | null): string {
  if (!value) {
    return "Дата публикации";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Дата публикации";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Moscow",
  }).format(date);
}

function renderBlock(block: PublicPublicationDetail["body_blocks"][number], index: number) {
  if (block.kind === "image" && block.url) {
    return (
      <figure key={index} style={{ margin: 0, display: "grid", gap: "0.75rem" }}>
        <img
          src={block.url}
          alt={block.caption ?? block.title ?? ""}
          style={{ width: "100%", display: "block", borderRadius: "0.375rem", background: "#111" }}
        />
        {block.caption ? <figcaption style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.4)" }}>{block.caption}</figcaption> : null}
      </figure>
    );
  }

  if (block.kind === "video" && block.url) {
    return (
      <figure key={index} style={{ margin: 0, display: "grid", gap: "0.75rem" }}>
        <video controls src={block.url} style={{ width: "100%", display: "block", borderRadius: "0.375rem", background: "#111" }} />
        {block.caption ? <figcaption style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.4)" }}>{block.caption}</figcaption> : null}
      </figure>
    );
  }

  return (
    <section key={index} style={{ fontSize: "1rem", lineHeight: 1.7, color: "rgba(255,255,255,0.75)" }}>
      {block.title ? (
        <h2
          style={{
            fontSize: "1.35rem",
            fontWeight: 700,
            lineHeight: 1.25,
            margin: "0 0 0.85rem",
            color: "#fff",
            letterSpacing: "-0.02em",
          }}
        >
          {block.title}
        </h2>
      ) : null}
      {block.value ? <p style={{ margin: 0 }}>{block.value}</p> : null}
    </section>
  );
}

export function PublicArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<PublicPublicationDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!slug) {
        setError("Публикация не указана.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await getPublicPublication(slug);
        if (!cancelled) {
          setArticle(response);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить публикацию.");
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
  }, [slug]);

  if (isLoading) {
    return (
      <main style={{ minHeight: "100vh", background: "#000", color: "#fff" }}>
        <article style={{ maxWidth: "720px", margin: "0 auto", padding: "4rem 1.75rem 8rem" }}>
          <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.4)" }}>Загрузка статьи...</p>
        </article>
      </main>
    );
  }

  if (error || !article) {
    return (
      <main style={{ minHeight: "100vh", background: "#000", color: "#fff" }}>
        <article style={{ maxWidth: "720px", margin: "0 auto", padding: "4rem 1.75rem 8rem" }}>
          <div style={{ marginBottom: "2.5rem" }}>
            <Link to="/updates" style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>
              &lt;- Обновления
            </Link>
          </div>
          <h1
            style={{
              fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.15,
              marginBottom: "1.25rem",
              color: "#fff",
            }}
          >
            Статья не найдена
          </h1>
          <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.4)", marginBottom: "2.5rem" }}>{error ?? "Контент ещё не загружен."}</p>
        </article>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "#000", color: "#fff" }}>
      <article style={{ maxWidth: "720px", margin: "0 auto", padding: "4rem 1.75rem 8rem" }}>
        <div style={{ marginBottom: "2.5rem" }}>
          <Link to="/updates" style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>
            &lt;- Обновления
          </Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.75rem", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "0.75rem",
              color: "rgba(255,255,255,0.4)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {formatCategory(article.category)}
          </span>
          <span style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.75rem" }}>·</span>
          <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)" }}>{formatPublicationDate(article.published_at)}</span>
        </div>

        <h1
          style={{
            fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
            fontWeight: 700,
            letterSpacing: "-0.025em",
            lineHeight: 1.15,
            marginBottom: "1.25rem",
            color: "#fff",
          }}
        >
          {article.title}
        </h1>

        <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.45)", marginBottom: "2.5rem", lineHeight: 1.65 }}>{article.summary}</p>

        {article.preview_image_url || article.preview_video_url ? (
          <div
            style={{
              width: "100%",
              aspectRatio: "16 / 9",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "0.375rem",
              marginBottom: "2.5rem",
              overflow: "hidden",
            }}
          >
            {article.preview_video_url ? (
              <video controls src={article.preview_video_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : article.preview_image_url ? (
              <img src={article.preview_image_url} alt={article.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : null}
          </div>
        ) : (
          <div
            style={{
              width: "100%",
              aspectRatio: "16 / 9",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "0.375rem",
              marginBottom: "2.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.2)" }}>Обложка</span>
          </div>
        )}

        <div style={{ display: "grid", gap: "1.5rem" }}>
          {article.body_blocks.length ? (
            article.body_blocks.map((block, index) => renderBlock(block, index))
          ) : (
            <p style={{ fontSize: "1rem", lineHeight: 1.7, color: "rgba(255,255,255,0.75)" }}>
              Содержимое статьи будет доступно после подключения контентного потока.
            </p>
          )}
        </div>
      </article>
    </main>
  );
}
