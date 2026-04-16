import { useEffect, useMemo, useState } from "react";
import { ApiError } from "../../core/http";
import { PublicSubnav } from "../components/PublicSubnav";
import {
  createCommunityComment,
  createCommunityDiscussion,
  createCommunityPublication,
  createCommunityReview,
  deleteCommunityComment,
  deleteCommunityDiscussion,
  deleteCommunityPublication,
  deleteCommunityReview,
  getCommunityViewerContext,
  listCommunityAdminPublications,
  listCommunityDiscussions,
  listCommunityMembers,
  listCommunityReviews,
  listPublications,
  reactToCommunityComment,
  reactToCommunityDiscussion,
  updateCommunityMember,
  updateCommunityPublication,
  type CommunityComment,
  type CommunityDiscussion,
  type CommunityDiscussionCategory,
  type CommunityMemberProfile,
  type CommunityProduct,
  type CommunityPublicationAdmin,
  type CommunityPublicationAdminBlock,
  type CommunityReview,
  type CommunityReviewSort,
  type CommunityReviewSummary,
  type CommunityViewerContext,
  type PublicPublicationCategory,
  type PublicPublicationListItem,
} from "../api";

type CommunitySection = "updates" | "discussions" | "reviews" | "materials" | "channels";
type AdminTab = "members" | "publications" | "moderation";
type PublicCommunityPageProps = { section: CommunitySection };

type DiscussionDraft = { title: string; body: string; imageDataUrl: string | null };
type ReviewDraft = { rating: number; advantages: string; disadvantages: string; body: string };
type PublicationDraft = {
  id: string | null;
  slug: string;
  title: string;
  summary: string;
  category: PublicPublicationCategory;
  status: "draft" | "published";
  previewImageUrl: string;
  previewVideoUrl: string;
  publishedAt: string;
  bodyBlocks: CommunityPublicationAdminBlock[];
};

const EMPTY_SUMMARY: CommunityReviewSummary = {
  product: "nerior",
  average_rating: 0,
  total_reviews: 0,
  rating_breakdown: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
};
const EMPTY_DISCUSSION: DiscussionDraft = { title: "", body: "", imageDataUrl: null };
const EMPTY_REVIEW: ReviewDraft = { rating: 0, advantages: "", disadvantages: "", body: "" };
const EMPTY_PUBLICATION: PublicationDraft = {
  id: null,
  slug: "",
  title: "",
  summary: "",
  category: "publication",
  status: "draft",
  previewImageUrl: "",
  previewVideoUrl: "",
  publishedAt: "",
  bodyBlocks: [{ kind: "paragraph", title: "", value: "", url: "", caption: "" }],
};

const COMMUNITY_LINKS = [
  { label: "Обновления", href: "/updates" },
  { label: "Обсуждения", href: "/discussions" },
  { label: "Отзывы", href: "/reviews" },
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
  { value: "feedback", label: "Обратная связь" },
  { value: "integration", label: "Интеграции" },
  { value: "support", label: "Поддержка" },
  { value: "product", label: "Продукт" },
];
const REVIEW_SORTS: { value: CommunityReviewSort; label: string }[] = [
  { value: "newest", label: "Сначала новые" },
  { value: "oldest", label: "Сначала старые" },
  { value: "rating_desc", label: "Оценка: убывание" },
  { value: "rating_asc", label: "Оценка: возрастание" },
];

const MATERIALS = [
  { title: "Документация", body: "Руководства по продуктам, API и рабочим сценариям внутри Nerior.", href: "https://docs.nerior.store", label: "Открыть docs" },
  { title: "Справочный центр", body: "Короткие ответы, инструкции и маршруты для типовых ситуаций.", href: "https://help.nerior.store", label: "Открыть help" },
  { title: "API и ключи", body: "Отдельный кабинет для ключей, аналитики usage и интеграций.", href: "https://api.nerior.store", label: "Открыть API" },
  { title: "Связаться с нами", body: "Если нужен прямой запрос команде Nerior, используйте основную форму связи.", href: "https://nerior.store/contact", label: "Открыть форму" },
];
const CHANNELS = [
  { title: "Обновления", body: "Статьи, анонсы и публичные релизы по продуктам Nerior.", href: "https://nerior.store/updates", label: "Открыть updates" },
  { title: "Документация", body: "Структурированная база знаний по общим темам и продуктам.", href: "https://docs.nerior.store", label: "Открыть docs" },
  { title: "Справочный центр", body: "Быстрые ответы и маршруты в нужные материалы.", href: "https://help.nerior.store", label: "Открыть help" },
  { title: "Поддержка в Telegram", body: "Прямая поддержка по платформе и рабочим вопросам.", href: "https://t.me/nerior_IT", label: "Перейти в поддержку" },
  { title: "Telegram-канал", body: "Публичные обновления, заметки и новости по продуктам.", href: "https://t.me/nerior_public", label: "Открыть канал" },
  { title: "Telegram CEO", body: "Контекст и позиция основателя Nerior.", href: "https://t.me/Karpov_Stepan", label: "Открыть канал CEO" },
  { title: "API-кабинет", body: "Управление ключами и доступом к API-поверхностям продуктов.", href: "https://api.nerior.store", label: "Открыть API" },
  { title: "Главный сайт", body: "Корпоративная витрина Nerior с продуктами, бизнесом и контактами.", href: "https://nerior.store", label: "Открыть nerior.store" },
];

function isAuthError(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    const body = error.body.trim();
    if (body.startsWith("{")) {
      try {
        const parsed = JSON.parse(body) as { detail?: string };
        if (typeof parsed.detail === "string" && parsed.detail.trim()) return parsed.detail;
      } catch {
        return body;
      }
    }
    if (body) return body;
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

function buildAuthHref(): string {
  return "https://crossplat.nerior.store/login";
}

function toLocalDateTime(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function toIsoDateTime(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function mapPublicationToDraft(publication: CommunityPublicationAdmin): PublicationDraft {
  return {
    id: publication.id,
    slug: publication.slug,
    title: publication.title,
    summary: publication.summary,
    category: publication.category,
    status: publication.status,
    previewImageUrl: publication.preview_image_url ?? "",
    previewVideoUrl: publication.preview_video_url ?? "",
    publishedAt: toLocalDateTime(publication.published_at),
    bodyBlocks: publication.body_blocks.length ? publication.body_blocks.map((block) => ({ ...block })) : EMPTY_PUBLICATION.bodyBlocks,
  };
}

function mapDraftToPublicationPayload(draft: PublicationDraft) {
  return {
    slug: draft.slug,
    title: draft.title,
    summary: draft.summary,
    category: draft.category,
    status: draft.status,
    preview_image_url: draft.previewImageUrl || null,
    preview_video_url: draft.previewVideoUrl || null,
    published_at: toIsoDateTime(draft.publishedAt),
    body_blocks: draft.bodyBlocks.map((block) => ({
      kind: block.kind,
      title: block.title || null,
      value: block.value || null,
      url: block.url || null,
      caption: block.caption || null,
    })),
  };
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Не удалось прочитать файл."));
    reader.readAsDataURL(file);
  });
}

export function PublicCommunityPage({ section }: PublicCommunityPageProps) {
  const [product, setProduct] = useState<CommunityProduct>("nerior");
  const [category, setCategory] = useState<CommunityDiscussionCategory>("general");
  const [discussionSearch, setDiscussionSearch] = useState("");
  const [reviewSort, setReviewSort] = useState<CommunityReviewSort>("newest");
  const [viewerContext, setViewerContext] = useState<CommunityViewerContext>({ authenticated: false, profile: null });
  const [publications, setPublications] = useState<PublicPublicationListItem[]>([]);
  const [discussions, setDiscussions] = useState<CommunityDiscussion[]>([]);
  const [reviews, setReviews] = useState<CommunityReview[]>([]);
  const [reviewSummary, setReviewSummary] = useState<CommunityReviewSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [discussionComposerOpen, setDiscussionComposerOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [discussionDraft, setDiscussionDraft] = useState<DiscussionDraft>(EMPTY_DISCUSSION);
  const [reviewDraft, setReviewDraft] = useState<ReviewDraft>(EMPTY_REVIEW);
  const [members, setMembers] = useState<CommunityMemberProfile[]>([]);
  const [memberQuery, setMemberQuery] = useState("");
  const [adminTab, setAdminTab] = useState<AdminTab>("members");
  const [adminPublications, setAdminPublications] = useState<CommunityPublicationAdmin[]>([]);
  const [publicationDraft, setPublicationDraft] = useState<PublicationDraft>(EMPTY_PUBLICATION);
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isAdmin = Boolean(viewerContext.profile?.is_admin);

  async function loadViewerContext() {
    try {
      setViewerContext(await getCommunityViewerContext());
    } catch (cause) {
      setViewerContext({ authenticated: false, profile: null });
      if (!isAuthError(cause)) setError(extractErrorMessage(cause, "Не удалось определить состояние пользователя."));
    }
  }

  async function loadSectionData(activeSection = section) {
    setLoading(true);
    setError(null);
    try {
      if (activeSection === "updates") {
        setPublications(await listPublications());
      } else if (activeSection === "discussions") {
        setDiscussions(await listCommunityDiscussions({ product, category, search: discussionSearch }));
      } else if (activeSection === "reviews") {
        const response = await listCommunityReviews(product, reviewSort);
        setReviews(response.items);
        setReviewSummary(response.summary);
      }
    } catch (cause) {
      setError(extractErrorMessage(cause, "Не удалось загрузить сообщество."));
    } finally {
      setLoading(false);
    }
  }

  async function loadAdminData() {
    if (!isAdmin) return;
    try {
      const [memberItems, publicationItems] = await Promise.all([
        listCommunityMembers(memberQuery),
        listCommunityAdminPublications(),
      ]);
      setMembers(memberItems);
      setAdminPublications(publicationItems);
    } catch (cause) {
      setError(extractErrorMessage(cause, "Не удалось загрузить данные администратора."));
    }
  }

  useEffect(() => {
    void loadViewerContext();
  }, []);

  useEffect(() => {
    void loadSectionData();
  }, [section, product, category, discussionSearch, reviewSort]);

  useEffect(() => {
    if (adminOpen) void loadAdminData();
  }, [adminOpen, memberQuery]);

  async function guardAuthenticated(action: () => Promise<void>) {
    if (!viewerContext.authenticated) {
      setAuthModalOpen(true);
      return;
    }
    try {
      await action();
      await loadViewerContext();
    } catch (cause) {
      if (isAuthError(cause)) {
        setAuthModalOpen(true);
        await loadViewerContext();
        return;
      }
      setError(extractErrorMessage(cause, "Операция не выполнена."));
    }
  }

  async function handleDiscussionSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await guardAuthenticated(async () => {
      setSubmitting(true);
      try {
        await createCommunityDiscussion({
          product,
          category,
          title: discussionDraft.title,
          body: discussionDraft.body,
          imageDataUrl: discussionDraft.imageDataUrl,
        });
        setDiscussionDraft(EMPTY_DISCUSSION);
        setDiscussionComposerOpen(false);
        await loadSectionData("discussions");
      } finally {
        setSubmitting(false);
      }
    });
  }

  async function handleReviewSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await guardAuthenticated(async () => {
      setSubmitting(true);
      try {
        await createCommunityReview({
          product,
          rating: reviewDraft.rating,
          advantages: reviewDraft.advantages,
          disadvantages: reviewDraft.disadvantages,
          body: reviewDraft.body,
        });
        setReviewDraft(EMPTY_REVIEW);
        setReviewModalOpen(false);
        await loadSectionData("reviews");
      } finally {
        setSubmitting(false);
      }
    });
  }

  async function handleDiscussionImageChange(file: File | null) {
    if (!file) {
      setDiscussionDraft((state) => ({ ...state, imageDataUrl: null }));
      return;
    }
    const imageDataUrl = await fileToDataUrl(file);
    setDiscussionDraft((state) => ({ ...state, imageDataUrl }));
  }

  async function handleMemberSave(member: CommunityMemberProfile) {
    setSavingAdmin(true);
    try {
      await updateCommunityMember(member.user_id, {
        isVerified: member.is_verified,
        roleTag: member.role_tag ?? null,
        isAdmin: member.is_admin,
      });
      await loadAdminData();
    } catch (cause) {
      setError(extractErrorMessage(cause, "Не удалось обновить пользователя."));
    } finally {
      setSavingAdmin(false);
    }
  }

  async function handlePublicationSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingAdmin(true);
    try {
      if (publicationDraft.id) {
        await updateCommunityPublication(publicationDraft.id, mapDraftToPublicationPayload(publicationDraft));
      } else {
        await createCommunityPublication(mapDraftToPublicationPayload(publicationDraft));
      }
      setPublicationDraft(EMPTY_PUBLICATION);
      await loadAdminData();
    } catch (cause) {
      setError(extractErrorMessage(cause, "Не удалось сохранить публикацию."));
    } finally {
      setSavingAdmin(false);
    }
  }

  function updateBlock(index: number, key: keyof CommunityPublicationAdminBlock, value: string) {
    setPublicationDraft((state) => ({
      ...state,
      bodyBlocks: state.bodyBlocks.map((block, blockIndex) => (blockIndex === index ? { ...block, [key]: value } : block)),
    }));
  }

  const subnavActions = useMemo(() => {
    const adminButton = isAdmin ? (
      <button type="button" className="public-community-action-link" onClick={() => setAdminOpen(true)}>
        Админ
      </button>
    ) : null;

    if (section === "discussions") {
      return (
        <>
          <input className="public-community-search" value={discussionSearch} onChange={(event) => setDiscussionSearch(event.target.value)} placeholder="Поиск по обсуждениям" />
          <button type="button" className="public-community-icon-button" aria-label="Создать обсуждение" onClick={() => (viewerContext.authenticated ? setDiscussionComposerOpen(true) : setAuthModalOpen(true))}>+</button>
          {adminButton}
        </>
      );
    }

    if (section === "reviews") {
      return (
        <>
          <select className="public-community-select" value={reviewSort} onChange={(event) => setReviewSort(event.target.value as CommunityReviewSort)}>
            {REVIEW_SORTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <button type="button" className="public-community-action-link" onClick={() => (viewerContext.authenticated ? setReviewModalOpen(true) : setAuthModalOpen(true))}>
            Оставить отзыв
          </button>
          {adminButton}
        </>
      );
    }

    return adminButton;
  }, [discussionSearch, isAdmin, reviewSort, section, viewerContext.authenticated]);

  return (
    <>
      <PublicSubnav brand="Сообщество" brandHref="/updates" links={COMMUNITY_LINKS} actions={subnavActions} />
      <div className="public-shell">
        <main className="public-page public-community-page">
          <section className="public-section">
            <div className="public-section__header">
              <div>
                <span className="public-eyebrow">Community</span>
                <h1>{sectionTitle(section)}</h1>
              </div>
              <p className="public-community-lead">{sectionLead(section)}</p>
            </div>

            {(section === "discussions" || section === "reviews") ? (
              <div className="public-chip-row">
                {PRODUCT_TABS.map((tab) => <button key={tab.value} type="button" className={`public-chip ${tab.value === product ? "is-active" : ""}`} onClick={() => setProduct(tab.value)}>{tab.label}</button>)}
              </div>
            ) : null}
            {section === "discussions" ? (
              <div className="public-chip-row">
                {CATEGORY_TABS.map((tab) => <button key={tab.value} type="button" className={`public-chip ${tab.value === category ? "is-active" : ""}`} onClick={() => setCategory(tab.value)}>{tab.label}</button>)}
              </div>
            ) : null}

            {error ? <p className="public-form-feedback public-form-feedback--error">{error}</p> : null}
            {section === "updates" ? <CommunityUpdatesSection items={publications} loading={loading} /> : null}
            {section === "discussions" ? <CommunityDiscussionsSection discussions={discussions} loading={loading} currentUserId={viewerContext.profile?.user_id ?? null} onLikeDiscussion={(discussionId) => guardAuthenticated(async () => { await reactToCommunityDiscussion(discussionId); await loadSectionData("discussions"); })} onCreateComment={(discussionId, body, parentId) => guardAuthenticated(async () => { await createCommunityComment(discussionId, { body, parentId }); await loadSectionData("discussions"); })} onReactComment={(commentId, reaction) => guardAuthenticated(async () => { await reactToCommunityComment(commentId, reaction); await loadSectionData("discussions"); })} onOpenAuth={() => setAuthModalOpen(true)} /> : null}
            {section === "reviews" ? <CommunityReviewsSection loading={loading} reviews={reviews} summary={reviewSummary} /> : null}
            {section === "materials" ? <CardGridSection title="Материалы сообщества" body="Основные публичные поверхности, в которые пользователь обычно уходит из community." items={MATERIALS} /> : null}
            {section === "channels" ? <CardGridSection title="Каналы и точки входа" body="Где читать, куда писать и какие поверхности использовать по разным сценариям." items={CHANNELS} /> : null}
          </section>
        </main>
      </div>
      <CommunityModal open={discussionComposerOpen} title="Новое обсуждение" onClose={() => setDiscussionComposerOpen(false)}>
        <form className="public-community-form" onSubmit={handleDiscussionSubmit}>
          <label className="public-field"><span>Тема</span><input value={discussionDraft.title} onChange={(event) => setDiscussionDraft((state) => ({ ...state, title: event.target.value }))} placeholder="Короткий заголовок обсуждения" required /></label>
          <label className="public-field public-field--full"><span>Описание</span><textarea value={discussionDraft.body} onChange={(event) => setDiscussionDraft((state) => ({ ...state, body: event.target.value }))} placeholder="Опишите вопрос, идею или наблюдение." required /></label>
          <label className="public-field public-field--full"><span>Фотография</span><input type="file" accept="image/*" onChange={(event) => void handleDiscussionImageChange(event.target.files?.[0] ?? null)} /></label>
          {discussionDraft.imageDataUrl ? <img className="public-community-image-preview" src={discussionDraft.imageDataUrl} alt="Предпросмотр обсуждения" /> : null}
          <div className="public-community-form__actions"><button type="submit" className="public-button public-button--solid" disabled={submitting}>Опубликовать</button><button type="button" className="public-button public-button--ghost" onClick={() => setDiscussionComposerOpen(false)}>Отмена</button></div>
        </form>
      </CommunityModal>

      <CommunityModal open={reviewModalOpen} title="Оставить отзыв" onClose={() => setReviewModalOpen(false)}>
        <form className="public-community-form" onSubmit={handleReviewSubmit}>
          <div className="public-field"><span>Оценка</span><div className="public-rating-picker">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" className={`public-rating-picker__star ${value <= reviewDraft.rating ? "is-active" : ""}`} onClick={() => setReviewDraft((state) => ({ ...state, rating: value }))}>{value <= reviewDraft.rating ? "★" : "☆"}</button>)}</div></div>
          <label className="public-field public-field--full"><span>Достоинства</span><textarea value={reviewDraft.advantages} onChange={(event) => setReviewDraft((state) => ({ ...state, advantages: event.target.value }))} required /></label>
          <label className="public-field public-field--full"><span>Недостатки</span><textarea value={reviewDraft.disadvantages} onChange={(event) => setReviewDraft((state) => ({ ...state, disadvantages: event.target.value }))} required /></label>
          <label className="public-field public-field--full"><span>Комментарий</span><textarea value={reviewDraft.body} onChange={(event) => setReviewDraft((state) => ({ ...state, body: event.target.value }))} /></label>
          <div className="public-community-form__actions"><button type="submit" className="public-button public-button--solid" disabled={submitting || reviewDraft.rating === 0}>Отправить отзыв</button><button type="button" className="public-button public-button--ghost" onClick={() => setReviewModalOpen(false)}>Отмена</button></div>
        </form>
      </CommunityModal>

      <CommunityModal open={authModalOpen} title="Требуется авторизация" onClose={() => setAuthModalOpen(false)}>
        <div className="public-community-auth-modal">
          <p>Для продолжения необходимо авторизоваться в сети Nerior.</p>
          <div className="public-community-form__actions"><a className="public-button public-button--solid" href={buildAuthHref()}>Авторизоваться</a><button type="button" className="public-button public-button--ghost" onClick={() => setAuthModalOpen(false)}>Закрыть</button></div>
        </div>
      </CommunityModal>

      <CommunityModal open={adminOpen} title="Админ" onClose={() => setAdminOpen(false)} wide>
        <div className="public-chip-row">{[{ value: "members", label: "Пользователи" }, { value: "publications", label: "Публикации" }, { value: "moderation", label: "Модерация" }].map((tab) => <button key={tab.value} type="button" className={`public-chip ${adminTab === tab.value ? "is-active" : ""}`} onClick={() => setAdminTab(tab.value as AdminTab)}>{tab.label}</button>)}</div>
        {adminTab === "members" ? <section className="public-community-admin-grid"><label className="public-field public-field--full"><span>Поиск пользователя</span><input value={memberQuery} onChange={(event) => setMemberQuery(event.target.value)} placeholder="Email или часть email" /></label><div className="public-community-admin-list">{members.map((member) => <div key={member.user_id} className="public-doc-card"><div className="public-community-admin-card__header"><div><strong>{member.display_name}</strong><p>{member.email}</p></div>{member.is_root_admin ? <span className="public-community-pill">Root admin</span> : null}</div><label className="public-community-inline-checkbox"><input type="checkbox" checked={member.is_verified} onChange={(event) => setMembers((current) => current.map((item) => item.user_id === member.user_id ? { ...item, is_verified: event.target.checked } : item))} /><span>Верифицирован</span></label><label className="public-community-inline-checkbox"><input type="checkbox" checked={member.is_admin || member.is_root_admin} disabled={member.is_root_admin} onChange={(event) => setMembers((current) => current.map((item) => item.user_id === member.user_id ? { ...item, is_admin: event.target.checked } : item))} /><span>Админ</span></label><label className="public-field"><span>Тег</span><input value={member.role_tag ?? ""} onChange={(event) => setMembers((current) => current.map((item) => item.user_id === member.user_id ? { ...item, role_tag: event.target.value } : item))} /></label><button type="button" className="public-button public-button--ghost" onClick={() => void handleMemberSave(member)} disabled={savingAdmin}>Сохранить</button></div>)}</div></section> : null}
        {adminTab === "publications" ? <section className="public-community-admin-publications"><div className="public-community-admin-list">{adminPublications.map((publication) => <button key={publication.id} type="button" className="public-doc-card public-community-publication-button" onClick={() => setPublicationDraft(mapPublicationToDraft(publication))}><strong>{publication.title}</strong><p>{publication.slug}</p></button>)}</div><form className="public-community-form" onSubmit={handlePublicationSave}><div className="public-community-form__header"><strong>{publicationDraft.id ? "Редактирование публикации" : "Новая публикация"}</strong>{publicationDraft.id ? <button type="button" className="public-community-action-link" onClick={() => setPublicationDraft(EMPTY_PUBLICATION)}>Сбросить</button> : null}</div><label className="public-field"><span>Slug</span><input value={publicationDraft.slug} onChange={(event) => setPublicationDraft((state) => ({ ...state, slug: event.target.value }))} required /></label><label className="public-field"><span>Заголовок</span><input value={publicationDraft.title} onChange={(event) => setPublicationDraft((state) => ({ ...state, title: event.target.value }))} required /></label><label className="public-field public-field--full"><span>Summary</span><textarea value={publicationDraft.summary} onChange={(event) => setPublicationDraft((state) => ({ ...state, summary: event.target.value }))} required /></label><label className="public-field"><span>Категория</span><select value={publicationDraft.category} onChange={(event) => setPublicationDraft((state) => ({ ...state, category: event.target.value as PublicPublicationCategory }))}>{["publication", "announcement", "integration", "release"].map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label className="public-field"><span>Статус</span><select value={publicationDraft.status} onChange={(event) => setPublicationDraft((state) => ({ ...state, status: event.target.value as "draft" | "published" }))}><option value="draft">draft</option><option value="published">published</option></select></label><label className="public-field"><span>Preview image URL</span><input value={publicationDraft.previewImageUrl} onChange={(event) => setPublicationDraft((state) => ({ ...state, previewImageUrl: event.target.value }))} /></label><label className="public-field"><span>Preview video URL</span><input value={publicationDraft.previewVideoUrl} onChange={(event) => setPublicationDraft((state) => ({ ...state, previewVideoUrl: event.target.value }))} /></label><label className="public-field"><span>Дата публикации</span><input type="datetime-local" value={publicationDraft.publishedAt} onChange={(event) => setPublicationDraft((state) => ({ ...state, publishedAt: event.target.value }))} /></label><div className="public-field public-field--full"><span>Блоки статьи</span><div className="public-community-block-list">{publicationDraft.bodyBlocks.map((block, index) => <div key={`${block.kind}-${index}`} className="public-route-card"><div className="public-community-block-grid"><label className="public-field"><span>Тип</span><input value={block.kind} onChange={(event) => updateBlock(index, "kind", event.target.value)} /></label><label className="public-field"><span>Заголовок</span><input value={block.title ?? ""} onChange={(event) => updateBlock(index, "title", event.target.value)} /></label><label className="public-field public-field--full"><span>Значение</span><textarea value={block.value ?? ""} onChange={(event) => updateBlock(index, "value", event.target.value)} /></label><label className="public-field"><span>URL</span><input value={block.url ?? ""} onChange={(event) => updateBlock(index, "url", event.target.value)} /></label><label className="public-field"><span>Подпись</span><input value={block.caption ?? ""} onChange={(event) => updateBlock(index, "caption", event.target.value)} /></label></div><button type="button" className="public-community-action-link" onClick={() => setPublicationDraft((state) => ({ ...state, bodyBlocks: state.bodyBlocks.filter((_, blockIndex) => blockIndex !== index) }))}>Удалить блок</button></div>)}</div><button type="button" className="public-button public-button--ghost" onClick={() => setPublicationDraft((state) => ({ ...state, bodyBlocks: [...state.bodyBlocks, { kind: "paragraph", title: "", value: "", url: "", caption: "" }] }))}>Добавить блок</button></div><div className="public-community-form__actions"><button type="submit" className="public-button public-button--solid" disabled={savingAdmin}>Сохранить публикацию</button>{publicationDraft.id ? <button type="button" className="public-button public-button--ghost" onClick={async () => { setSavingAdmin(true); try { await deleteCommunityPublication(publicationDraft.id as string); setPublicationDraft(EMPTY_PUBLICATION); await loadAdminData(); } finally { setSavingAdmin(false); } }}>Удалить публикацию</button> : null}</div></form></section> : null}
        {adminTab === "moderation" ? <section className="public-community-admin-grid"><div className="public-doc-card"><strong>Обсуждения</strong><div className="public-community-admin-list">{discussions.map((discussion) => <div key={discussion.id} className="public-route-card"><strong>{discussion.title}</strong><p>{discussion.author.display_name}</p><button type="button" className="public-community-action-link" onClick={async () => { await deleteCommunityDiscussion(discussion.id); await loadSectionData("discussions"); }}>Удалить обсуждение</button></div>)}</div></div><div className="public-doc-card"><strong>Комментарии</strong><div className="public-community-admin-list">{discussions.flatMap((discussion) => flattenComments(discussion.comments).map((comment) => <div key={comment.id} className="public-route-card"><strong>{comment.author.display_name}</strong><p>{comment.body}</p><button type="button" className="public-community-action-link" onClick={async () => { await deleteCommunityComment(comment.id); await loadSectionData("discussions"); }}>Удалить комментарий</button></div>))}</div></div><div className="public-doc-card"><strong>Отзывы</strong><div className="public-community-admin-list">{reviews.map((review) => <div key={review.id} className="public-route-card"><strong>{review.author.display_name}</strong><p>{review.advantages}</p><button type="button" className="public-community-action-link" onClick={async () => { await deleteCommunityReview(review.id); await loadSectionData("reviews"); }}>Удалить отзыв</button></div>)}</div></div></section> : null}
      </CommunityModal>
    </>
  );
}

function CommunityUpdatesSection({ items, loading }: { items: PublicPublicationListItem[]; loading: boolean }) {
  if (loading) return <div className="public-empty-state"><strong>Загрузка публикаций...</strong></div>;
  if (items.length === 0) return <div className="public-empty-state"><strong>Пока нет опубликованных материалов.</strong><p>Когда новые статьи и анонсы будут готовы, они появятся здесь.</p></div>;
  return <div className="public-updates-grid">{items.map((item) => <a key={item.id} href={`https://nerior.store/updates/${item.slug}`} className="public-update-card"><div className="public-update-card__media">{item.preview_image_url ? <img src={item.preview_image_url} alt={item.title} /> : <div className="public-update-card__placeholder" />}</div><div className="public-update-card__body"><div className="public-update-card__meta"><span>{item.category}</span>{item.published_at ? <span>{new Date(item.published_at).toLocaleDateString("ru-RU")}</span> : null}</div><h2>{item.title}</h2><p>{item.summary}</p></div></a>)}</div>;
}

function CommunityDiscussionsSection({ discussions, loading, currentUserId, onLikeDiscussion, onCreateComment, onReactComment, onOpenAuth }: { discussions: CommunityDiscussion[]; loading: boolean; currentUserId: string | null; onLikeDiscussion: (discussionId: string) => Promise<void>; onCreateComment: (discussionId: string, body: string, parentId?: string) => Promise<void>; onReactComment: (commentId: string, reaction: "like" | "dislike") => Promise<void>; onOpenAuth: () => void; }) {
  if (loading) return <div className="public-empty-state"><strong>Загрузка обсуждений...</strong></div>;
  if (discussions.length === 0) return <div className="public-empty-state"><strong>Пока в этой ветке нет обсуждений.</strong><p>Создайте первое аккуратное обсуждение через плюсик в верхней панели.</p></div>;
  return <div className="public-community-feed">{discussions.map((discussion) => <DiscussionCard key={discussion.id} discussion={discussion} currentUserId={currentUserId} onLikeDiscussion={onLikeDiscussion} onCreateComment={onCreateComment} onReactComment={onReactComment} onOpenAuth={onOpenAuth} />)}</div>;
}

function DiscussionCard({ discussion, currentUserId, onLikeDiscussion, onCreateComment, onReactComment, onOpenAuth }: { discussion: CommunityDiscussion; currentUserId: string | null; onLikeDiscussion: (discussionId: string) => Promise<void>; onCreateComment: (discussionId: string, body: string, parentId?: string) => Promise<void>; onReactComment: (commentId: string, reaction: "like" | "dislike") => Promise<void>; onOpenAuth: () => void; }) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [sending, setSending] = useState(false);
  async function submitComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentUserId) return onOpenAuth();
    setSending(true);
    try { await onCreateComment(discussion.id, commentBody); setCommentBody(""); setCommentsOpen(true); } finally { setSending(false); }
  }
  return <article className="public-contact-form-card public-community-post"><div className="public-community-post__header"><div><div className="public-community-author-row"><strong>{discussion.author.display_name}</strong>{discussion.author.is_verified ? <span className="public-community-badge">Проверен</span> : null}{discussion.author.role_tag ? <span className="public-community-tag">{discussion.author.role_tag}</span> : null}</div><p className="public-community-meta">{new Date(discussion.created_at).toLocaleString("ru-RU")}</p></div><div className="public-community-post__actions"><button type="button" className={`public-community-heart ${discussion.viewer_reaction === "like" ? "is-active" : ""}`} onClick={() => void onLikeDiscussion(discussion.id)}><span>{discussion.viewer_reaction === "like" ? "♥" : "♡"}</span><span>{discussion.like_count}</span></button><button type="button" className="public-community-action-link" onClick={() => setCommentsOpen((value) => !value)}>{commentsOpen ? "Свернуть комментарии" : `Развернуть комментарии (${discussion.comment_count})`}</button></div></div><div className="public-community-post__body"><h2>{discussion.title}</h2><p>{discussion.body}</p>{discussion.image_data_url ? <img className="public-community-post__image" src={discussion.image_data_url} alt={discussion.title} /> : null}</div>{commentsOpen ? <div className="public-community-comments"><form className="public-community-comment-form" onSubmit={submitComment}><textarea value={commentBody} onChange={(event) => setCommentBody(event.target.value)} placeholder="Добавить комментарий" required /><button type="submit" className="public-button public-button--ghost" disabled={sending}>Комментировать</button></form>{discussion.comments.length === 0 ? <p className="public-community-meta">Пока нет комментариев.</p> : <div className="public-community-comment-list">{discussion.comments.map((comment) => <CommentNode key={comment.id} discussionId={discussion.id} comment={comment} currentUserId={currentUserId} onCreateComment={onCreateComment} onReactComment={onReactComment} onOpenAuth={onOpenAuth} />)}</div>}</div> : null}</article>;
}

function CommentNode({ discussionId, comment, currentUserId, onCreateComment, onReactComment, onOpenAuth }: { discussionId: string; comment: CommunityComment; currentUserId: string | null; onCreateComment: (discussionId: string, body: string, parentId?: string) => Promise<void>; onReactComment: (commentId: string, reaction: "like" | "dislike") => Promise<void>; onOpenAuth: () => void; }) {
  const [repliesOpen, setRepliesOpen] = useState(true);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);
  async function submitReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentUserId) return onOpenAuth();
    setSending(true);
    try { await onCreateComment(discussionId, replyBody, comment.id); setReplyBody(""); setReplyOpen(false); setRepliesOpen(true); } finally { setSending(false); }
  }
  return <div className="public-community-comment"><div className="public-community-author-row"><strong>{comment.author.display_name}</strong>{comment.author.is_verified ? <span className="public-community-badge">Проверен</span> : null}{comment.author.role_tag ? <span className="public-community-tag">{comment.author.role_tag}</span> : null}</div><p className="public-community-meta">{new Date(comment.created_at).toLocaleString("ru-RU")}</p><p>{comment.body}</p><div className="public-community-comment__actions"><button type="button" className={`public-community-heart ${comment.viewer_reaction === "like" ? "is-active" : ""}`} onClick={() => void onReactComment(comment.id, "like")}><span>{comment.viewer_reaction === "like" ? "♥" : "♡"}</span><span>{comment.like_count}</span></button><button type="button" className={`public-community-action-link ${comment.viewer_reaction === "dislike" ? "is-active" : ""}`} onClick={() => void onReactComment(comment.id, "dislike")}>Не нравится</button><button type="button" className="public-community-action-link" onClick={() => setReplyOpen((value) => !value)}>Ответить</button>{comment.replies.length > 0 ? <button type="button" className="public-community-action-link" onClick={() => setRepliesOpen((value) => !value)}>{repliesOpen ? "Свернуть ответы" : `Развернуть ответы (${comment.replies.length})`}</button> : null}</div>{replyOpen ? <form className="public-community-comment-form" onSubmit={submitReply}><textarea value={replyBody} onChange={(event) => setReplyBody(event.target.value)} placeholder="Ваш ответ" required /><button type="submit" className="public-button public-button--ghost" disabled={sending}>Ответить</button></form> : null}{repliesOpen && comment.replies.length > 0 ? <div className="public-community-comment-list">{comment.replies.map((reply) => <CommentNode key={reply.id} discussionId={discussionId} comment={reply} currentUserId={currentUserId} onCreateComment={onCreateComment} onReactComment={onReactComment} onOpenAuth={onOpenAuth} />)}</div> : null}</div>;
}

function CommunityReviewsSection({ loading, reviews, summary }: { loading: boolean; reviews: CommunityReview[]; summary: CommunityReviewSummary }) {
  if (loading) return <div className="public-empty-state"><strong>Загрузка отзывов...</strong></div>;
  return <div className="public-stack-grid"><div className="public-doc-card"><span className="public-eyebrow">Рейтинг</span><h2>{summary.average_rating ? `${summary.average_rating} / 5` : "Нет оценок"}</h2><p>Всего отзывов: {summary.total_reviews}</p><div className="public-community-rating-breakdown">{Object.entries(summary.rating_breakdown).reverse().map(([rating, count]) => <div key={rating} className="public-community-rating-row"><span>{rating}★</span><strong>{count}</strong></div>)}</div></div><div className="public-community-feed">{reviews.length === 0 ? <div className="public-empty-state"><strong>Пока нет отзывов.</strong><p>Первый предметный отзыв можно оставить через кнопку в верхней панели.</p></div> : reviews.map((review) => <article key={review.id} className="public-contact-form-card public-community-review"><div className="public-community-author-row"><strong>{review.author.display_name}</strong>{review.author.is_verified ? <span className="public-community-badge">Проверен</span> : null}{review.author.role_tag ? <span className="public-community-tag">{review.author.role_tag}</span> : null}</div><div className="public-community-stars">{Array.from({ length: 5 }).map((_, index) => <span key={index} className={index < review.rating ? "is-active" : ""}>{index < review.rating ? "★" : "☆"}</span>)}</div><p className="public-community-meta">{new Date(review.created_at).toLocaleDateString("ru-RU")}</p><div><strong>Достоинства</strong><p>{review.advantages}</p></div><div><strong>Недостатки</strong><p>{review.disadvantages}</p></div>{review.body ? <div><strong>Комментарий</strong><p>{review.body}</p></div> : null}</article>)}</div></div>;
}

function CardGridSection({ title, body, items }: { title: string; body: string; items: { title: string; body: string; href: string; label: string }[] }) {
  return <section className="public-section"><div className="public-section__header"><div><span className="public-eyebrow">Навигация</span><h2>{title}</h2></div><p>{body}</p></div><div className="public-link-grid">{items.map((item) => <a key={item.href} href={item.href} className="public-doc-card" target={item.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer"><strong>{item.title}</strong><p>{item.body}</p><span className="public-inline-link">{item.label}</span></a>)}</div></section>;
}

function CommunityModal({ open, title, onClose, wide = false, children }: { open: boolean; title: string; onClose: () => void; wide?: boolean; children: React.ReactNode }) {
  if (!open) return null;
  return <div className="public-community-modal" role="dialog" aria-modal="true"><div className="public-community-modal__backdrop" onClick={onClose} /><div className={`public-community-modal__dialog ${wide ? "is-wide" : ""}`}><div className="public-community-modal__header"><strong>{title}</strong><button type="button" className="public-community-action-link" onClick={onClose}>Закрыть</button></div><div className="public-community-modal__body">{children}</div></div></div>;
}

function flattenComments(comments: CommunityComment[]): CommunityComment[] {
  return comments.flatMap((comment) => [comment, ...flattenComments(comment.replies)]);
}

function sectionTitle(section: CommunitySection): string {
  if (section === "updates") return "Публичные обновления и анонсы экосистемы Nerior.";
  if (section === "discussions") return "Обсуждения пользователей, команды и продукта в одном аккуратном контуре.";
  if (section === "reviews") return "Отзывы о продуктах, пользе и реальном опыте работы.";
  if (section === "materials") return "Маршруты в документацию, API, справку и ключевые материалы.";
  return "Каналы связи, точки входа и публичные поверхности вокруг Nerior.";
}

function sectionLead(section: CommunitySection): string {
  if (section === "updates") return "Здесь живут статьи и публичные материалы. Контент подтягивается из той же публикационной модели, что и основной раздел обновлений.";
  if (section === "discussions") return "Ветка обсуждений нужна для живого разговора: вопросы, обратная связь, интеграции, продуктовые наблюдения и ответы команды.";
  if (section === "reviews") return "Отзывы вынесены отдельно от обсуждений, чтобы у продукта была чистая, читаемая ветка с рейтингом, плюсами и минусами.";
  if (section === "materials") return "Отсюда пользователь уходит в соседние публичные поверхности: docs, help, API и основную форму связи.";
  return "В каналах собраны основные точки связи Nerior: support, публичный Telegram, документация, сайт и API-кабинет.";
}
