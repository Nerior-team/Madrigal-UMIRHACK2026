import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { DOCS_LIBRARY_GROUPS, DOCS_PILLARS, DOCS_SECTIONS } from "../site-content";

const REFERENCE_ROUTES = [
  { method: "GET", path: "/api/v1/external/machines", description: "\u0421\u043f\u0438\u0441\u043e\u043a \u043c\u0430\u0448\u0438\u043d, \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u044b\u0445 \u043f\u043e \u043a\u043b\u044e\u0447\u0443." },
  { method: "GET", path: "/api/v1/external/machines/{machine_id}", description: "\u0414\u0435\u0442\u0430\u043b\u0438 \u043a\u043e\u043d\u043a\u0440\u0435\u0442\u043d\u043e\u0439 \u043c\u0430\u0448\u0438\u043d\u044b." },
  { method: "GET", path: "/api/v1/external/machines/{machine_id}/commands", description: "\u0420\u0430\u0437\u0440\u0435\u0448\u0451\u043d\u043d\u044b\u0435 \u043a\u043e\u043c\u0430\u043d\u0434\u044b \u043c\u0430\u0448\u0438\u043d\u044b." },
  { method: "POST", path: "/api/v1/external/tasks", description: "\u0421\u043e\u0437\u0434\u0430\u043d\u0438\u0435 \u043d\u043e\u0432\u043e\u0439 \u0437\u0430\u0434\u0430\u0447\u0438." },
  { method: "GET", path: "/api/v1/external/tasks/{task_id}", description: "\u0421\u043e\u0441\u0442\u043e\u044f\u043d\u0438\u0435 \u0438 \u043c\u0435\u0442\u0430\u0434\u0430\u043d\u043d\u044b\u0435 \u0437\u0430\u0434\u0430\u0447\u0438." },
  { method: "GET", path: "/api/v1/external/tasks/{task_id}/logs", description: "\u041b\u043e\u0433\u0438 \u043a\u043e\u043d\u043a\u0440\u0435\u0442\u043d\u043e\u0439 \u0437\u0430\u0434\u0430\u0447\u0438." },
  { method: "GET", path: "/api/v1/external/results/{result_id}", description: "\u041a\u0430\u0440\u0442\u043e\u0447\u043a\u0430 \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u0430." },
  { method: "GET", path: "/api/v1/external/results/{result_id}/summary", description: "\u041a\u0440\u0430\u0442\u043a\u0430\u044f \u0441\u0432\u043e\u0434\u043a\u0430 \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u0430." },
  { method: "GET", path: "/api/v1/external/results/{result_id}/export/json", description: "\u042d\u043a\u0441\u043f\u043e\u0440\u0442 \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u0430 \u0432 JSON." },
] as const;

const DOC_LINKS = [
  { label: "\u041e\u0431\u0437\u043e\u0440", slug: "" },
  { label: "\u041d\u0430\u0447\u0430\u043b\u043e \u0440\u0430\u0431\u043e\u0442\u044b", slug: "getting-started" },
  { label: "Crossplat", slug: "crossplat" },
  { label: "API", slug: "api" },
  { label: "\u0420\u0443\u043a\u043e\u0432\u043e\u0434\u0441\u0442\u0432\u0430", slug: "guides" },
  { label: "\u0421\u043f\u0440\u0430\u0432\u043e\u0447\u043d\u0438\u043a", slug: "reference" },
  { label: "FAQ", slug: "faq" },
] as const;

const METHOD_COLORS: Record<string, string> = { GET: "#b8d975", POST: "#88b9ff" };

function resolveSlug(pathname: string): string {
  const normalized = pathname.replace(/^\/+/, "").replace(/\/+$/, "");
  return normalized || "";
}

export function PublicDocsPage() {
  const location = useLocation();
  const slug = useMemo(() => resolveSlug(location.pathname), [location.pathname]);
  const section = DOCS_SECTIONS.find((item) => item.slug === slug);

  return <main className="public-page public-page--docs"><section className="public-docs-hero"><div className="public-docs-hero__copy"><span className="public-eyebrow">docs.nerior.store</span><h1>{"\u0414\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u0430\u0446\u0438\u044f Nerior"}</h1><p>{"\u041f\u0443\u0431\u043b\u0438\u0447\u043d\u0430\u044f \u0431\u0438\u0431\u043b\u0438\u043e\u0442\u0435\u043a\u0430 \u043c\u0430\u0442\u0435\u0440\u0438\u0430\u043b\u043e\u0432 \u043f\u043e \u043f\u0440\u043e\u0434\u0443\u043a\u0442\u0430\u043c, \u0432\u043d\u0435\u0448\u043d\u0435\u043c\u0443 API, \u0440\u0430\u0431\u043e\u0447\u0438\u043c \u0441\u0446\u0435\u043d\u0430\u0440\u0438\u044f\u043c \u0438 support-\u043c\u0430\u0440\u0448\u0440\u0443\u0442\u0430\u043c. \u0420\u0430\u0437\u0434\u0435\u043b \u043d\u0435 \u0441\u043c\u0435\u0448\u0438\u0432\u0430\u0435\u0442\u0441\u044f \u0441 \u043a\u043e\u0440\u043f\u043e\u0440\u0430\u0442\u0438\u0432\u043d\u044b\u043c \u0441\u0430\u0439\u0442\u043e\u043c \u0438 \u043d\u0435 \u0437\u0430\u0432\u0438\u0441\u0438\u0442 \u043e\u0442 \u043f\u0440\u043e\u0434\u0443\u043a\u0442\u043e\u0432\u043e\u0433\u043e \u0438\u043d\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0430 Crossplat."}</p></div><div className="public-feature-grid">{DOCS_PILLARS.map((item) => <article key={item.title} className="public-feature-card"><h2>{item.title}</h2><p>{item.body}</p></article>)}</div></section><div className="public-docs-layout"><aside className="public-docs-sidebar"><span className="public-eyebrow">{"\u041d\u0430\u0432\u0438\u0433\u0430\u0446\u0438\u044f"}</span><nav>{DOC_LINKS.map((item) => <a key={item.slug || "root"} href={item.slug ? `https://docs.nerior.store/${item.slug}` : "https://docs.nerior.store/"} className={slug === item.slug ? "is-active" : undefined}>{item.label}</a>)}</nav></aside><section className="public-docs-content">{section ? <article className="public-doc-card"><span className="public-eyebrow">{"\u0420\u0430\u0437\u0434\u0435\u043b"}</span><h2>{section.title}</h2><p>{section.body}</p>{section.slug === "api" || section.slug === "reference" ? <div className="public-reference-table">{REFERENCE_ROUTES.map((route) => <div key={route.path} className="public-reference-row"><span style={{ color: METHOD_COLORS[route.method] ?? "#fff" }}>{route.method}</span><code>{route.path}</code><p>{route.description}</p></div>)}</div> : null}</article> : <div className="public-docs-stack">{DOCS_SECTIONS.map((entry) => <article key={entry.slug} className="public-doc-card"><span className="public-eyebrow">{"\u0420\u0430\u0437\u0434\u0435\u043b"}</span><h2>{entry.title}</h2><p>{entry.body}</p><a href={`https://docs.nerior.store/${entry.slug}`} className="public-inline-link">{"\u041e\u0442\u043a\u0440\u044b\u0442\u044c \u0440\u0430\u0437\u0434\u0435\u043b"}</a></article>)}</div>}</section></div><section className="public-section"><div className="public-section__header"><div><span className="public-eyebrow">{"\u0411\u0438\u0431\u043b\u0438\u043e\u0442\u0435\u043a\u0430"}</span><h2>{"\u041c\u0430\u0442\u0435\u0440\u0438\u0430\u043b\u044b \u0440\u0430\u0437\u043b\u043e\u0436\u0435\u043d\u044b \u043f\u043e \u0442\u0438\u043f\u0430\u043c, \u0430 \u043d\u0435 \u0441\u0432\u0430\u043b\u0435\u043d\u044b \u0432 \u043e\u0434\u043d\u0443 \u0434\u043b\u0438\u043d\u043d\u0443\u044e \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u0443."}</h2></div></div><div className="public-library-grid">{DOCS_LIBRARY_GROUPS.map((group) => <article key={group.title} className="public-story-card"><span className="public-eyebrow">{"\u041a\u043e\u043b\u043b\u0435\u043a\u0446\u0438\u044f"}</span><h2>{group.title}</h2><ul className="public-card-list">{group.items.map((item) => <li key={item}>{item}</li>)}</ul></article>)}</div></section></main>;
}
