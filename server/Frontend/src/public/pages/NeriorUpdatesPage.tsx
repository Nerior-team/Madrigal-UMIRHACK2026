import { LayoutGrid, List } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UPDATE_CATEGORIES } from "../site-content";
import { listPublications, type PublicPublicationCategory, type PublicPublicationListItem } from "../api";

type UpdatesView = "grid" | "list";

const TEXT = {
  all: "\u0412\u0441\u0435",
  publications: "\u041f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u0438",
  announcements: "\u0410\u043d\u043e\u043d\u0441\u044b",
  integrations: "\u0418\u043d\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u0438",
  releases: "\u0420\u0435\u043b\u0438\u0437\u044b",
  missingDate: "\u0414\u0430\u0442\u0430 \u0431\u0443\u0434\u0435\u0442 \u0434\u043e\u0431\u0430\u0432\u043b\u0435\u043d\u0430",
  loadError: "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u043f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u0438.",
} as const;

const CATEGORY_MAP: Record<(typeof UPDATE_CATEGORIES)[number], PublicPublicationCategory | undefined> = {
  [TEXT.all]: undefined,
  [TEXT.publications]: "publication",
  [TEXT.announcements]: "announcement",
  [TEXT.integrations]: "integration",
  [TEXT.releases]: "release",
};

function formatPublicationDate(value?: string | null): string {
  if (!value) return TEXT.missingDate;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return TEXT.missingDate;
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Moscow" }).format(date);
}

function formatCategory(value: string): string {
  if (value === "publication") return "\u041f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u044f";
  if (value === "announcement") return "\u0410\u043d\u043e\u043d\u0441";
  if (value === "integration") return "\u0418\u043d\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u044f";
  if (value === "release") return "\u0420\u0435\u043b\u0438\u0437";
  return value;
}

export function NeriorUpdatesPage() {
  const [activeCategory, setActiveCategory] = useState<(typeof UPDATE_CATEGORIES)[number]>(TEXT.all);
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
        if (!cancelled) setItems(response);
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
  }, [activeCategory]);

  return (
    <main className="public-page public-page--updates">
      <section className="public-updates-shell">
        <div className="public-updates-header"><div><span className="public-eyebrow">{"\u041e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u044f"}</span><h1>{"\u041f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u0438, \u0440\u0435\u043b\u0438\u0437\u044b \u0438 \u0430\u043d\u043e\u043d\u0441\u044b Nerior."}</h1></div><div className="public-view-toggle" aria-label={"\u0420\u0435\u0436\u0438\u043c \u043e\u0442\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u044f"}><button type="button" className={view === "grid" ? "public-view-toggle__button is-active" : "public-view-toggle__button"} onClick={() => setView("grid")} aria-pressed={view === "grid"}><LayoutGrid size={16} /></button><button type="button" className={view === "list" ? "public-view-toggle__button is-active" : "public-view-toggle__button"} onClick={() => setView("list")} aria-pressed={view === "list"}><List size={16} /></button></div></div>
        <div className="public-chip-row" role="tablist" aria-label={"\u041a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u0438 \u043e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u0439"}>{UPDATE_CATEGORIES.map((category) => <button key={category} type="button" className={category === activeCategory ? "public-chip is-active" : "public-chip"} onClick={() => setActiveCategory(category)}>{category}</button>)}</div>
        <section className={view === "grid" ? "public-updates-grid" : "public-updates-list"}>
          {isLoading ? <article className="public-empty-state"><span className="public-eyebrow">{"\u041e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u044f"}</span><h2>{"\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u043f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u0439..."}</h2></article> : error ? <article className="public-empty-state"><span className="public-eyebrow">{"\u041e\u0448\u0438\u0431\u043a\u0430"}</span><h2>{"\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043f\u043e\u043b\u0443\u0447\u0438\u0442\u044c \u043f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u0438."}</h2><p>{error}</p></article> : items.length === 0 ? <article className="public-empty-state"><span className="public-eyebrow">{"\u041f\u043e\u043a\u0430 \u043f\u0443\u0441\u0442\u043e"}</span><h2>{"\u041f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u0438 \u0435\u0449\u0451 \u043d\u0435 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043d\u044b \u0432 \u0431\u0430\u0437\u0443."}</h2><p>{"\u0420\u0430\u0437\u0434\u0435\u043b \u0443\u0436\u0435 \u043f\u043e\u0434\u043a\u043b\u044e\u0447\u0451\u043d \u043a \u0440\u0435\u0430\u043b\u044c\u043d\u043e\u043c\u0443 backend API. \u041a\u043e\u0433\u0434\u0430 \u0441\u0442\u0430\u0442\u044c\u0438 \u043f\u043e\u044f\u0432\u044f\u0442\u0441\u044f \u0432 \u0441\u0438\u0441\u0442\u0435\u043c\u0435, \u043e\u043d\u0438 \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u0438 \u043e\u0442\u043e\u0431\u0440\u0430\u0437\u044f\u0442\u0441\u044f \u0437\u0434\u0435\u0441\u044c \u0431\u0435\u0437 \u043c\u043e\u043a\u043e\u0432 \u0438 \u0431\u0435\u0437 \u043e\u0442\u0434\u0435\u043b\u044c\u043d\u043e\u0439 \u043f\u0440\u0430\u0432\u043a\u0438 \u0444\u0440\u043e\u043d\u0442\u0430."}</p></article> : view === "grid" ? items.map((item) => <Link key={item.id} to={`/updates/${item.slug}`} className="public-update-card"><div className="public-update-card__media">{item.preview_image_url ? <img src={item.preview_image_url} alt={item.title} /> : <div className="public-update-card__placeholder" />}</div><div className="public-update-card__body"><h2>{item.title}</h2><p>{item.summary}</p><div className="public-update-card__meta"><span>{formatCategory(item.category)}</span><small>{formatPublicationDate(item.published_at)}</small></div></div></Link>) : items.map((item) => <Link key={item.id} to={`/updates/${item.slug}`} className="public-update-row"><div className="public-update-row__meta"><span>{formatCategory(item.category)}</span><small>{formatPublicationDate(item.published_at)}</small></div><div className="public-update-row__body"><h2>{item.title}</h2><p>{item.summary}</p></div></Link>)}
        </section>
      </section>
    </main>
  );
}
