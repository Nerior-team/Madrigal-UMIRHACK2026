import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPublicPublication, type PublicPublicationDetail } from "../api";

function renderBlock(block: PublicPublicationDetail["body_blocks"][number], index: number) {
  if (block.kind === "image" && block.url) {
    return (
      <figure key={index} className="public-article-media">
        <img src={block.url} alt={block.caption ?? block.title ?? ""} />
        {block.caption ? <figcaption>{block.caption}</figcaption> : null}
      </figure>
    );
  }

  if (block.kind === "video" && block.url) {
    return (
      <figure key={index} className="public-article-media">
        <video controls src={block.url} />
        {block.caption ? <figcaption>{block.caption}</figcaption> : null}
      </figure>
    );
  }

  return (
    <section key={index} className="public-article-copy">
      {block.title ? <h2>{block.title}</h2> : null}
      {block.value ? <p>{block.value}</p> : null}
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
      <main className="public-page">
        <article className="public-empty-state">
          <span className="public-eyebrow">Публикация</span>
          <h2>Загрузка статьи...</h2>
        </article>
      </main>
    );
  }

  if (error || !article) {
    return (
      <main className="public-page">
        <article className="public-empty-state">
          <span className="public-eyebrow">Публикация</span>
          <h2>Статья не найдена.</h2>
          <p>{error ?? "Контент ещё не загружен."}</p>
        </article>
      </main>
    );
  }

  return (
    <main className="public-page public-page--article">
      <article className="public-article">
        <header className="public-article__header">
          <span className="public-eyebrow">{article.category}</span>
          <h1>{article.title}</h1>
          <p>{article.summary}</p>
        </header>
        {article.body_blocks.length ? (
          <div className="public-article__body">
            {article.body_blocks.map((block, index) => renderBlock(block, index))}
          </div>
        ) : (
          <article className="public-empty-state">
            <span className="public-eyebrow">Контент</span>
            <h2>Тело статьи пока не загружено.</h2>
            <p>
              После импорта данных здесь появятся текстовые, графические и видео-блоки.
            </p>
          </article>
        )}
      </article>
    </main>
  );
}
