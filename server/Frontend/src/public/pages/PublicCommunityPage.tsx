import { useEffect, useMemo, useState } from "react";
import { PublicSubnav } from "../components/PublicSubnav";
import {
  createCommunityComment,
  createCommunityDiscussion,
  createCommunityReview,
  listCommunityDiscussions,
  listCommunityReviews,
  listPublications,
  reactToCommunityComment,
  type CommunityComment,
  type CommunityDiscussion,
  type CommunityDiscussionCategory,
  type CommunityProduct,
  type CommunityReview,
  type CommunityReviewSummary,
  type PublicPublicationListItem,
} from "../api";

type CommunitySection = "updates" | "discussions" | "materials" | "channels";

type PublicCommunityPageProps = {
  section: CommunitySection;
};

const COMMUNITY_LINKS = [
  { label: "Обновления", href: "/updates" },
  { label: "Обсуждения", href: "/discussions" },
  { label: "Материалы", href: "/materials" },
  { label: "Каналы", href: "/channels" },
];

const PRODUCT_TABS: { value: CommunityProduct; label: string }[] = [
  { value: "nerior", label: "Nerior" },
  { value: "crossplat", label: "Crossplat" },
  { value: "smart-planner", label: "Smart-Planner" },
  { value: "karpik", label: "Karpik" },
];

const CATEGORY_TABS: { value: CommunityDiscussionCategory; label: string }[] = [
  { value: "general", label: "Общее" },
  { value: "feedback", label: "Отзывы" },
  { value: "integration", label: "Интеграции" },
  { value: "support", label: "Поддержка" },
  { value: "product", label: "Продукт" },
];

const MATERIALS = [
  {
    title: "Документация",
    body: "Структурированное описание платформы, продуктов, маршрутов и рабочих сценариев.",
    href: "https://docs.nerior.store",
    label: "Открыть docs",
  },
  {
    title: "Справочный центр",
    body: "Частые вопросы, разбор типовых ситуаций и маршруты в нужные поверхности.",
    href: "https://help.nerior.store",
    label: "Открыть help",
  },
  {
    title: "API и ключи",
    body: "Отдельная поверхность для доступа к ключам, аналитике и будущим мультипродуктовым интеграциям.",
    href: "https://api.nerior.store",
    label: "Открыть API",
  },
  {
    title: "Связаться с нами",
    body: "Если нужен прямой запрос, можно сразу перейти в форму и описать задачу командой Nerior.",
    href: "https://nerior.store/contact",
    label: "Открыть форму",
  },
];

const CHANNELS = [
  { title: "Обновления", body: "Публикации, анонсы и новые материалы по продуктам.", href: "https://nerior.store/updates", label: "Открыть updates" },
  { title: "Документация", body: "Подробные инструкции, продукты и API-справочник.", href: "https://docs.nerior.store", label: "Открыть docs" },
  { title: "Справочный центр", body: "Быстрые ответы и типовые сценарии поддержки.", href: "https://help.nerior.store", label: "Открыть help" },
  { title: "Поддержка в Telegram", body: "Прямая точка связи по вопросам платформы и рабочих ситуаций.", href: "https://t.me/nerior_IT", label: "Перейти в поддержку" },
  { title: "Telegram-канал", body: "Публичные анонсы, новости и заметки о развитии продуктов.", href: "https://t.me/nerior_public", label: "Открыть канал" },
  { title: "Telegram CEO", body: "Личный канал с контекстом, вектором и продуктовой позицией.", href: "https://t.me/Karpov_Stepan", label: "Открыть канал CEO" },
  { title: "API-кабинет", body: "Отдельный контур для доступа к ключам, usage и будущим продуктам.", href: "https://api.nerior.store", label: "Открыть API" },
  { title: "Контакт с командой", body: "Если нужна предметная коммуникация, лучше сразу перейти в форму заявки.", href: "https://nerior.store/contact", label: "Связаться" },
];

const EMPTY_SUMMARY: CommunityReviewSummary = {
  product: "nerior",
  average_rating: 0,
  total_reviews: 0,
  rating_breakdown: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
};

export function PublicCommunityPage({ section }: PublicCommunityPageProps) {
  const [product, setProduct] = useState<CommunityProduct>("nerior");
  const [category, setCategory] = useState<CommunityDiscussionCategory>("general");
  const [publications, setPublications] = useState<PublicPublicationListItem[]>([]);
  const [discussions, setDiscussions] = useState<CommunityDiscussion[]>([]);
  const [reviews, setReviews] = useState<CommunityReview[]>([]);
  const [reviewSummary, setReviewSummary] = useState<CommunityReviewSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discussionForm, setDiscussionForm] = useState({ authorName: "", title: "", body: "" });
  const [reviewForm, setReviewForm] = useState({ authorName: "", roleTitle: "", rating: "5", advantages: "", disadvantages: "", body: "" });

  async function loadCommunityData(activeSection: CommunitySection, activeProduct = product, activeCategory = category) {
    setLoading(true);
    setError(null);
    try {
      if (activeSection === "updates") {
        setPublications(await listPublications());
      }
      if (activeSection === "discussions") {
        const [discussionItems, reviewResponse] = await Promise.all([
          listCommunityDiscussions({ product: activeProduct, category: activeCategory }),
          listCommunityReviews(activeProduct),
        ]);
        setDiscussions(discussionItems);
        setReviews(reviewResponse.items);
        setReviewSummary(reviewResponse.summary);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось загрузить сообщество.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCommunityData(section);
  }, [section]);

  useEffect(() => {
    if (section === "discussions") {
      void loadCommunityData(section, product, category);
    }
  }, [section, product, category]);

  async function handleDiscussionSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createCommunityDiscussion({ product, category, ...discussionForm });
      setDiscussionForm({ authorName: "", title: "", body: "" });
      await loadCommunityData("discussions", product, category);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось создать обсуждение.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReviewSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createCommunityReview({
        product,
        authorName: reviewForm.authorName,
        roleTitle: reviewForm.roleTitle,
        rating: Number(reviewForm.rating),
        advantages: reviewForm.advantages,
        disadvantages: reviewForm.disadvantages,
        body: reviewForm.body,
      });
      setReviewForm({ authorName: "", roleTitle: "", rating: "5", advantages: "", disadvantages: "", body: "" });
      await loadCommunityData("discussions", product, category);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось отправить отзыв.");
    } finally {
      setSubmitting(false);
    }
  }

  const sectionContent = useMemo(() => {
    if (section === "updates") {
      return <CommunityUpdatesSection items={publications} loading={loading} />;
    }
    if (section === "materials") {
      return <CardGridSection title="Материалы сообщества" body="Основные публичные поверхности, в которые пользователь обычно уходит из community." items={MATERIALS} />;
    }
    if (section === "channels") {
      return <CardGridSection title="Каналы и точки входа" body="Где читать, куда писать и какие поверхности использовать по разным сценариям." items={CHANNELS} />;
    }
    return (
      <CommunityDiscussionsSection
        product={product}
        category={category}
        discussions={discussions}
        reviews={reviews}
        reviewSummary={reviewSummary}
        loading={loading}
        submitting={submitting}
        error={error}
        discussionForm={discussionForm}
        reviewForm={reviewForm}
        onProductChange={setProduct}
        onCategoryChange={setCategory}
        onDiscussionFormChange={setDiscussionForm}
        onReviewFormChange={setReviewForm}
        onDiscussionSubmit={handleDiscussionSubmit}
        onReviewSubmit={handleReviewSubmit}
        onRefresh={() => loadCommunityData("discussions", product, category)}
      />
    );
  }, [section, publications, loading, product, category, discussions, reviews, reviewSummary, submitting, error, discussionForm, reviewForm]);

  return (
    <>
      <PublicSubnav brand="Сообщество" brandHref="/updates" links={COMMUNITY_LINKS} />
      <div style={shellStyle}>
        <main style={contentStyle}>
          <p style={eyebrowStyle}>Community</p>
          <h1 style={titleStyle}>Открытые обсуждения, материалы и каналы связи вокруг продуктов Nerior.</h1>
          <p style={leadStyle}>
            Здесь собраны живые вопросы, обратная связь, продуктовые отзывы и маршруты в остальные публичные поверхности.
            Сообщество работает как точка связи между пользователями, командой и экосистемой продуктов.
          </p>
          {sectionContent}
        </main>
      </div>
    </>
  );
}

function CommunityUpdatesSection({ items, loading }: { items: PublicPublicationListItem[]; loading: boolean }) {
  return (
    <section style={sectionStyle}>
      <div style={sectionHeaderStyle}>
        <div>
          <p style={sectionKickerStyle}>Обновления</p>
          <h2 style={sectionTitleStyle}>Последние публикации и анонсы</h2>
        </div>
        <a href="https://nerior.store/updates" style={ghostLinkStyle}>Перейти в Updates</a>
      </div>
      {loading ? <p style={mutedStyle}>Загрузка публикаций...</p> : null}
      {!loading && items.length === 0 ? <p style={mutedStyle}>Пока нет опубликованных материалов.</p> : null}
      <div style={gridStyle}>
        {items.map((item) => (
          <a key={item.id} href={`https://nerior.store/updates/${item.slug}`} style={cardStyle}>
            <p style={cardEyebrowStyle}>{item.category}</p>
            <strong style={cardTitleStyle}>{item.title}</strong>
            <p style={cardBodyStyle}>{item.summary}</p>
          </a>
        ))}
      </div>
    </section>
  );
}

function CardGridSection({ title, body, items }: { title: string; body: string; items: { title: string; body: string; href: string; label: string }[] }) {
  return (
    <section style={sectionStyle}>
      <div style={sectionHeaderStyle}>
        <div>
          <p style={sectionKickerStyle}>Навигация</p>
          <h2 style={sectionTitleStyle}>{title}</h2>
        </div>
        <p style={sectionTextStyle}>{body}</p>
      </div>
      <div style={gridStyle}>
        {items.map((item) => (
          <a key={item.href} href={item.href} style={cardStyle} target={item.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
            <strong style={cardTitleStyle}>{item.title}</strong>
            <p style={cardBodyStyle}>{item.body}</p>
            <span style={ghostLinkStyle}>{item.label}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

function CommunityDiscussionsSection(props: {
  product: CommunityProduct;
  category: CommunityDiscussionCategory;
  discussions: CommunityDiscussion[];
  reviews: CommunityReview[];
  reviewSummary: CommunityReviewSummary;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  discussionForm: { authorName: string; title: string; body: string };
  reviewForm: { authorName: string; roleTitle: string; rating: string; advantages: string; disadvantages: string; body: string };
  onProductChange: (value: CommunityProduct) => void;
  onCategoryChange: (value: CommunityDiscussionCategory) => void;
  onDiscussionFormChange: (value: { authorName: string; title: string; body: string }) => void;
  onReviewFormChange: (value: { authorName: string; roleTitle: string; rating: string; advantages: string; disadvantages: string; body: string }) => void;
  onDiscussionSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onReviewSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onRefresh: () => Promise<void>;
}) {
  return (
    <section style={sectionStyle}>
      <div style={sectionHeaderStyle}>
        <div>
          <p style={sectionKickerStyle}>Обсуждения</p>
          <h2 style={sectionTitleStyle}>Рейтинги, комментарии и ветки по продуктам</h2>
        </div>
        <p style={sectionTextStyle}>Можно запускать отдельные обсуждения, отвечать в ветках, ставить реакции и оставлять нормальную предметную оценку продукту.</p>
      </div>
      <div style={tabRowStyle}>
        {PRODUCT_TABS.map((tab) => <button key={tab.value} type="button" onClick={() => props.onProductChange(tab.value)} style={chipStyle(tab.value === props.product)}>{tab.label}</button>)}
      </div>
      <div style={tabRowStyle}>
        {CATEGORY_TABS.map((tab) => <button key={tab.value} type="button" onClick={() => props.onCategoryChange(tab.value)} style={chipStyle(tab.value === props.category)}>{tab.label}</button>)}
      </div>
      {props.error ? <p style={errorStyle}>{props.error}</p> : null}
      <div style={statsGridStyle}>
        <StatCard label="Средний рейтинг" value={props.reviewSummary.average_rating ? `${props.reviewSummary.average_rating}/5` : "Нет оценок"} />
        <StatCard label="Отзывов" value={String(props.reviewSummary.total_reviews)} />
        <StatCard label="Обсуждений" value={String(props.discussions.length)} />
      </div>
      <div style={dualGridStyle}>
        <form onSubmit={props.onDiscussionSubmit} style={panelStyle}>
          <p style={panelKickerStyle}>Новое обсуждение</p>
          <input value={props.discussionForm.authorName} onChange={(e) => props.onDiscussionFormChange({ ...props.discussionForm, authorName: e.target.value })} placeholder="Ваше имя" style={inputStyle} required />
          <input value={props.discussionForm.title} onChange={(e) => props.onDiscussionFormChange({ ...props.discussionForm, title: e.target.value })} placeholder="Тема обсуждения" style={inputStyle} required />
          <textarea value={props.discussionForm.body} onChange={(e) => props.onDiscussionFormChange({ ...props.discussionForm, body: e.target.value })} placeholder="Опишите вопрос, проблему, наблюдение или идею." style={textareaStyle} required />
          <button type="submit" style={primaryButtonStyle} disabled={props.submitting}>Опубликовать обсуждение</button>
        </form>
        <form onSubmit={props.onReviewSubmit} style={panelStyle}>
          <p style={panelKickerStyle}>Оценка сервиса</p>
          <input value={props.reviewForm.authorName} onChange={(e) => props.onReviewFormChange({ ...props.reviewForm, authorName: e.target.value })} placeholder="Ваше имя" style={inputStyle} required />
          <input value={props.reviewForm.roleTitle} onChange={(e) => props.onReviewFormChange({ ...props.reviewForm, roleTitle: e.target.value })} placeholder="Роль или контекст" style={inputStyle} />
          <select value={props.reviewForm.rating} onChange={(e) => props.onReviewFormChange({ ...props.reviewForm, rating: e.target.value })} style={inputStyle}>
            {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} из 5</option>)}
          </select>
          <textarea value={props.reviewForm.advantages} onChange={(e) => props.onReviewFormChange({ ...props.reviewForm, advantages: e.target.value })} placeholder="Достоинства" style={textareaCompactStyle} required />
          <textarea value={props.reviewForm.disadvantages} onChange={(e) => props.onReviewFormChange({ ...props.reviewForm, disadvantages: e.target.value })} placeholder="Недостатки" style={textareaCompactStyle} required />
          <textarea value={props.reviewForm.body} onChange={(e) => props.onReviewFormChange({ ...props.reviewForm, body: e.target.value })} placeholder="Дополнительный контекст" style={textareaCompactStyle} />
          <button type="submit" style={primaryButtonStyle} disabled={props.submitting}>Отправить отзыв</button>
        </form>
      </div>
      <div style={dualGridStyle}>
        <div style={panelStyle}>
          <p style={panelKickerStyle}>Ветки обсуждений</p>
          {props.loading ? <p style={mutedStyle}>Загрузка обсуждений...</p> : null}
          {!props.loading && props.discussions.length === 0 ? <p style={mutedStyle}>Пока нет обсуждений в этом разделе.</p> : null}
          <div style={stackStyle}>
            {props.discussions.map((discussion) => (
              <DiscussionCard key={discussion.id} discussion={discussion} onRefresh={props.onRefresh} />
            ))}
          </div>
        </div>
        <div style={panelStyle}>
          <p style={panelKickerStyle}>Отзывы по сервису</p>
          {props.loading ? <p style={mutedStyle}>Загрузка отзывов...</p> : null}
          {!props.loading && props.reviews.length === 0 ? <p style={mutedStyle}>Пока нет опубликованных отзывов.</p> : null}
          <div style={stackStyle}>
            {props.reviews.map((review) => (
              <article key={review.id} style={reviewCardStyle}>
                <div style={reviewHeaderStyle}>
                  <strong style={cardTitleStyle}>{review.author_name}</strong>
                  <span style={ratingStyle}>{"★".repeat(review.rating)}</span>
                </div>
                {review.role_title ? <p style={metaStyle}>{review.role_title}</p> : null}
                <p style={reviewTagStyle}>Достоинства</p>
                <p style={cardBodyStyle}>{review.advantages}</p>
                <p style={reviewTagStyle}>Недостатки</p>
                <p style={cardBodyStyle}>{review.disadvantages}</p>
                {review.body ? <p style={cardBodyStyle}>{review.body}</p> : null}
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function DiscussionCard({ discussion, onRefresh }: { discussion: CommunityDiscussion; onRefresh: () => Promise<void> }) {
  return (
    <article style={discussionCardStyle}>
      <div style={reviewHeaderStyle}>
        <div>
          <strong style={cardTitleStyle}>{discussion.title}</strong>
          <p style={metaStyle}>{discussion.author_name} · {new Date(discussion.created_at).toLocaleDateString("ru-RU")}</p>
        </div>
        <span style={metaBadgeStyle}>{discussion.comment_count} комментариев</span>
      </div>
      <p style={cardBodyStyle}>{discussion.body}</p>
      <CommentComposer discussionId={discussion.id} onSubmitted={onRefresh} />
      <div style={stackStyle}>
        {discussion.comments.map((comment) => <CommentNode key={comment.id} comment={comment} discussionId={discussion.id} depth={0} onRefresh={onRefresh} />)}
      </div>
    </article>
  );
}

function CommentComposer({ discussionId, parentId, onSubmitted }: { discussionId: string; parentId?: string; onSubmitted: () => Promise<void> }) {
  const [authorName, setAuthorName] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await createCommunityComment(discussionId, { authorName, body, parentId });
      setAuthorName("");
      setBody("");
      await onSubmitted();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={commentComposerStyle}>
      <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Ваше имя" style={inputStyle} required />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={parentId ? "Напишите ответ" : "Добавьте комментарий"} style={textareaCompactStyle} required />
      <button type="submit" style={secondaryButtonStyle} disabled={submitting}>{parentId ? "Ответить" : "Комментировать"}</button>
    </form>
  );
}

function CommentNode({ comment, discussionId, depth, onRefresh }: { comment: CommunityComment; discussionId: string; depth: number; onRefresh: () => Promise<void> }) {
  const [replyOpen, setReplyOpen] = useState(false);
  async function react(reaction: "like" | "dislike") {
    await reactToCommunityComment(comment.id, reaction);
    await onRefresh();
  }

  return (
    <div style={{ ...commentStyle, marginLeft: depth * 20 }}>
      <div style={reviewHeaderStyle}>
        <strong style={commentAuthorStyle}>{comment.author_name}</strong>
        <span style={metaStyle}>{new Date(comment.created_at).toLocaleString("ru-RU")}</span>
      </div>
      <p style={cardBodyStyle}>{comment.body}</p>
      <div style={commentActionsStyle}>
        <button type="button" onClick={() => react("like")} style={inlineButtonStyle}>Нравится · {comment.like_count}</button>
        <button type="button" onClick={() => react("dislike")} style={inlineButtonStyle}>Не нравится</button>
        <button type="button" onClick={() => setReplyOpen((value) => !value)} style={inlineButtonStyle}>Ответить</button>
      </div>
      {replyOpen ? <CommentComposer discussionId={discussionId} parentId={comment.id} onSubmitted={async () => { setReplyOpen(false); await onRefresh(); }} /> : null}
      {comment.replies.map((reply) => <CommentNode key={reply.id} comment={reply} discussionId={discussionId} depth={depth + 1} onRefresh={onRefresh} />)}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return <div style={statCardStyle}><span style={metaStyle}>{label}</span><strong style={statValueStyle}>{value}</strong></div>;
}

const shellStyle = { paddingTop: "var(--n-nav-h)", minHeight: "100vh", background: "#000", color: "#fff" } as const;
const contentStyle = { maxWidth: "1240px", margin: "0 auto", padding: "3rem 2rem 6rem" } as const;
const eyebrowStyle = { margin: 0, fontSize: "0.76rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.36)" } as const;
const titleStyle = { margin: "1rem 0 1rem", maxWidth: "920px", fontSize: "clamp(2.5rem, 5vw, 4.8rem)", lineHeight: 1, letterSpacing: "-0.05em" } as const;
const leadStyle = { margin: 0, maxWidth: "860px", color: "rgba(255,255,255,0.7)", fontSize: "1rem", lineHeight: 1.8 } as const;
const sectionStyle = { marginTop: "3rem", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1.5rem" } as const;
const sectionHeaderStyle = { display: "grid", gap: "0.9rem", marginBottom: "1.5rem" } as const;
const sectionKickerStyle = { margin: 0, color: "rgba(255,255,255,0.38)", fontSize: "0.76rem", letterSpacing: "0.1em", textTransform: "uppercase" } as const;
const sectionTitleStyle = { margin: 0, fontSize: "clamp(1.4rem, 2vw, 2rem)", lineHeight: 1.15 } as const;
const sectionTextStyle = { margin: 0, maxWidth: "760px", color: "rgba(255,255,255,0.68)", lineHeight: 1.7 } as const;
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" } as const;
const dualGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem", marginTop: "1rem" } as const;
const cardStyle = { display: "grid", gap: "0.8rem", minWidth: 0, padding: "1.1rem", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1rem", background: "rgba(255,255,255,0.03)", textDecoration: "none", color: "#fff" } as const;
const panelStyle = { display: "grid", gap: "0.8rem", alignContent: "start", padding: "1.1rem", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1rem", background: "rgba(255,255,255,0.03)" } as const;
const panelKickerStyle = { margin: 0, color: "rgba(255,255,255,0.4)", fontSize: "0.78rem", letterSpacing: "0.08em", textTransform: "uppercase" } as const;
const cardEyebrowStyle = { margin: 0, color: "rgba(255,255,255,0.36)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em" } as const;
const cardTitleStyle = { color: "#fff", fontSize: "1rem", lineHeight: 1.5 } as const;
const cardBodyStyle = { margin: 0, color: "rgba(255,255,255,0.7)", lineHeight: 1.75, whiteSpace: "pre-wrap" } as const;
const ghostLinkStyle = { color: "#fff", textDecoration: "none", fontSize: "0.92rem" } as const;
const mutedStyle = { margin: 0, color: "rgba(255,255,255,0.58)", lineHeight: 1.7 } as const;
const errorStyle = { margin: "0.75rem 0 0", color: "#ff9f9f", lineHeight: 1.7 } as const;
const tabRowStyle = { display: "flex", flexWrap: "wrap", gap: "0.65rem", marginTop: "1rem" } as const;
const statsGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.9rem", marginTop: "1rem" } as const;
const statCardStyle = { display: "grid", gap: "0.4rem", padding: "1rem", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)" } as const;
const statValueStyle = { fontSize: "1.6rem", lineHeight: 1.1, color: "#fff" } as const;
const inputStyle = { width: "100%", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.9rem", background: "rgba(255,255,255,0.02)", color: "#fff", padding: "0.9rem 1rem", outline: "none" } as const;
const textareaStyle = { ...inputStyle, minHeight: "150px", resize: "vertical" as const };
const textareaCompactStyle = { ...inputStyle, minHeight: "96px", resize: "vertical" as const };
const primaryButtonStyle = { height: "46px", borderRadius: "999px", background: "#fff", color: "#000", fontWeight: 600, cursor: "pointer" } as const;
const secondaryButtonStyle = { height: "40px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.16)", background: "transparent", color: "#fff", cursor: "pointer" } as const;
const discussionCardStyle = { display: "grid", gap: "0.9rem", padding: "1rem", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" } as const;
const reviewCardStyle = { display: "grid", gap: "0.55rem", padding: "1rem", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" } as const;
const reviewHeaderStyle = { display: "flex", alignItems: "start", justifyContent: "space-between", gap: "0.75rem" } as const;
const metaStyle = { margin: 0, color: "rgba(255,255,255,0.5)", fontSize: "0.86rem", lineHeight: 1.5 } as const;
const metaBadgeStyle = { color: "rgba(255,255,255,0.68)", fontSize: "0.82rem", whiteSpace: "nowrap" as const } as const;
const ratingStyle = { color: "#fff", letterSpacing: "0.08em", whiteSpace: "nowrap" as const } as const;
const reviewTagStyle = { margin: "0.3rem 0 0", color: "rgba(255,255,255,0.42)", fontSize: "0.75rem", textTransform: "uppercase" as const, letterSpacing: "0.08em" } as const;
const commentComposerStyle = { display: "grid", gap: "0.7rem", padding: "0.9rem", borderRadius: "0.9rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" } as const;
const commentStyle = { display: "grid", gap: "0.55rem", paddingLeft: "1rem", borderLeft: "1px solid rgba(255,255,255,0.08)" } as const;
const commentAuthorStyle = { color: "#fff", fontSize: "0.95rem" } as const;
const commentActionsStyle = { display: "flex", flexWrap: "wrap", gap: "0.8rem" } as const;
const inlineButtonStyle = { padding: 0, background: "transparent", color: "rgba(255,255,255,0.62)", textDecoration: "underline", cursor: "pointer" } as const;
const stackStyle = { display: "grid", gap: "0.9rem" } as const;
const chipStyle = (active: boolean) => ({
  minHeight: "38px",
  padding: "0 1rem",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: active ? "#fff" : "rgba(255,255,255,0.03)",
  color: active ? "#000" : "#fff",
  cursor: "pointer",
});
