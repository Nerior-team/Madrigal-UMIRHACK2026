import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPublicPublication, type PublicPublicationDetail } from "../api";

const TEXT = {
  publicationMissing: "\u041f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u044f \u043d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d\u0430.",
  loadError: "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u043f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u044e.",
} as const;

function formatCategory(value: string): string {
  if (value === "publication") return "\u041f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u044f";
  if (value === "announcement") return "\u0410\u043d\u043e\u043d\u0441";
  if (value === "integration") return "\u0418\u043d\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u044f";
  if (value === "release") return "\u0420\u0435\u043b\u0438\u0437";
  return value;
}

function renderBlock(block: PublicPublicationDetail["body_blocks"][number], index: number) {
  if (block.kind === "image" && block.url) return <figure key={index} className="public-article-media"><img src={block.url} alt={block.caption ?? block.title ?? ""} />{block.caption ? <figcaption>{block.caption}</figcaption> : null}</figure>;
  if (block.kind === "video" && block.url) return <figure key={index} className="public-article-media"><video controls src={block.url} />{block.caption ? <figcaption>{block.caption}</figcaption> : null}</figure>;
  return <section key={index} className="public-article-copy">{block.title ? <h2>{block.title}</h2> : null}{block.value ? <p>{block.value}</p> : null}</section>;
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
        setError(TEXT.publicationMissing);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const response = await getPublicPublication(slug);
        if (!cancelled) setArticle(response);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : TEXT.loadError);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (isLoading) return <main className="public-page public-page--article"><article className="public-empty-state"><span className="public-eyebrow">{"\u0421\u0442\u0430\u0442\u044c\u044f"}</span><h2>{"\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u0441\u0442\u0430\u0442\u044c\u0438..."}</h2></article></main>;

  if (error || !article) return <main className="public-page public-page--article"><article className="public-empty-state"><span className="public-eyebrow">{"\u0421\u0442\u0430\u0442\u044c\u044f"}</span><h2>{"\u0421\u0442\u0430\u0442\u044c\u044f \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u0430."}</h2><p>{error ?? "\u041a\u043e\u043d\u0442\u0435\u043d\u0442 \u0435\u0449\u0451 \u043d\u0435 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043d."}</p><Link to="/updates" className="public-inline-link">{"\u0412\u0435\u0440\u043d\u0443\u0442\u044c\u0441\u044f \u043a \u043e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u044f\u043c"}</Link></article></main>;

  return <main className="public-page public-page--article"><article className="public-article"><header className="public-article__header"><span className="public-eyebrow">{formatCategory(article.category)}</span><h1>{article.title}</h1><p>{article.summary}</p></header>{article.body_blocks.length ? <div className="public-article__body">{article.body_blocks.map((block, index) => renderBlock(block, index))}</div> : <article className="public-empty-state"><span className="public-eyebrow">{"\u041a\u043e\u043d\u0442\u0435\u043d\u0442"}</span><h2>{"\u0422\u0435\u043b\u043e \u0441\u0442\u0430\u0442\u044c\u0438 \u043f\u043e\u043a\u0430 \u043d\u0435 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043d\u043e."}</h2><p>{"\u041f\u043e\u0441\u043b\u0435 \u0438\u043c\u043f\u043e\u0440\u0442\u0430 \u0434\u0430\u043d\u043d\u044b\u0445 \u0437\u0434\u0435\u0441\u044c \u043f\u043e\u044f\u0432\u044f\u0442\u0441\u044f \u0442\u0435\u043a\u0441\u0442\u043e\u0432\u044b\u0435 \u0431\u043b\u043e\u043a\u0438, \u0438\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u044f \u0438 \u0432\u0441\u0442\u0440\u043e\u0435\u043d\u043d\u043e\u0435 \u0432\u0438\u0434\u0435\u043e."}</p></article>}</article></main>;
}
