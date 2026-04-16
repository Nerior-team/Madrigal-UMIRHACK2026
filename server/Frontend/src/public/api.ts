import { apiFetch } from "../core/http";

export type PublicContactPayload = {
  mode: "client" | "business";
  interest: "crossplat" | "smart-planner" | "karpik" | "other";
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName?: string;
  companySize?: string;
  message: string;
  marketing: boolean;
};

export async function submitPublicContact(payload: PublicContactPayload): Promise<{ detail: string }> {
  return apiFetch("/public/contact", {
    method: "POST",
    body: JSON.stringify({
      mode: payload.mode,
      interest: payload.interest,
      first_name: payload.firstName,
      last_name: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      company_name: payload.companyName ?? null,
      company_size: payload.companySize ?? null,
      message: payload.message,
      marketing: payload.marketing,
    }),
  });
}

export type PublicPublicationCategory =
  | "publication"
  | "announcement"
  | "integration"
  | "release";

export type PublicPublicationBlock = {
  kind: string;
  value?: string | null;
  url?: string | null;
  caption?: string | null;
  title?: string | null;
};

export type PublicPublicationListItem = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: PublicPublicationCategory;
  preview_image_url?: string | null;
  preview_video_url?: string | null;
  published_at?: string | null;
};

export type PublicPublicationDetail = PublicPublicationListItem & {
  body_blocks: PublicPublicationBlock[];
};

export async function listPublications(category?: PublicPublicationCategory): Promise<PublicPublicationListItem[]> {
  const query = category ? `?category=${category}` : "";
  const response = await apiFetch<{ items: PublicPublicationListItem[] }>(`/public/publications${query}`);
  return response.items;
}

export async function getPublicPublication(slug: string): Promise<PublicPublicationDetail> {
  return apiFetch<PublicPublicationDetail>(`/public/publications/${slug}`);
}

export type CommunityProduct = "nerior" | "crossplat" | "smart-planner" | "karpik";
export type CommunityDiscussionCategory = "general" | "feedback" | "integration" | "support" | "product";

export type CommunityComment = {
  id: string;
  discussion_id: string;
  parent_id?: string | null;
  author_name: string;
  body: string;
  like_count: number;
  dislike_count: number;
  created_at: string;
  replies: CommunityComment[];
};

export type CommunityDiscussion = {
  id: string;
  product: CommunityProduct;
  category: CommunityDiscussionCategory;
  author_name: string;
  title: string;
  body: string;
  comment_count: number;
  created_at: string;
  updated_at: string;
  comments: CommunityComment[];
};

export type CommunityReview = {
  id: string;
  product: CommunityProduct;
  author_name: string;
  role_title?: string | null;
  rating: number;
  advantages: string;
  disadvantages: string;
  body?: string | null;
  created_at: string;
};

export type CommunityReviewSummary = {
  product: CommunityProduct;
  average_rating: number;
  total_reviews: number;
  rating_breakdown: Record<string, number>;
};

export async function listCommunityDiscussions(filters: {
  product?: CommunityProduct;
  category?: CommunityDiscussionCategory;
} = {}): Promise<CommunityDiscussion[]> {
  const params = new URLSearchParams();
  if (filters.product) params.set("product", filters.product);
  if (filters.category) params.set("category", filters.category);
  const query = params.toString();
  const response = await apiFetch<{ items: CommunityDiscussion[] }>(
    `/public/community/discussions${query ? `?${query}` : ""}`,
  );
  return response.items;
}

export async function createCommunityDiscussion(payload: {
  product: CommunityProduct;
  category: CommunityDiscussionCategory;
  authorName: string;
  title: string;
  body: string;
}): Promise<CommunityDiscussion> {
  return apiFetch("/public/community/discussions", {
    method: "POST",
    body: JSON.stringify({
      product: payload.product,
      category: payload.category,
      author_name: payload.authorName,
      title: payload.title,
      body: payload.body,
    }),
  });
}

export async function createCommunityComment(
  discussionId: string,
  payload: { authorName: string; body: string; parentId?: string },
): Promise<CommunityComment> {
  return apiFetch(`/public/community/discussions/${discussionId}/comments`, {
    method: "POST",
    body: JSON.stringify({
      author_name: payload.authorName,
      body: payload.body,
      parent_id: payload.parentId ?? null,
    }),
  });
}

export async function reactToCommunityComment(
  commentId: string,
  reaction: "like" | "dislike",
): Promise<{ id: string; like_count: number; dislike_count: number }> {
  return apiFetch(`/public/community/comments/${commentId}/reaction`, {
    method: "POST",
    body: JSON.stringify({ reaction }),
  });
}

export async function listCommunityReviews(product: CommunityProduct): Promise<{
  summary: CommunityReviewSummary;
  items: CommunityReview[];
}> {
  return apiFetch(`/public/community/reviews?product=${product}`);
}

export async function createCommunityReview(payload: {
  product: CommunityProduct;
  authorName: string;
  roleTitle?: string;
  rating: number;
  advantages: string;
  disadvantages: string;
  body?: string;
}): Promise<CommunityReview> {
  return apiFetch("/public/community/reviews", {
    method: "POST",
    body: JSON.stringify({
      product: payload.product,
      author_name: payload.authorName,
      role_title: payload.roleTitle ?? null,
      rating: payload.rating,
      advantages: payload.advantages,
      disadvantages: payload.disadvantages,
      body: payload.body ?? null,
    }),
  });
}
