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
export type CommunityReaction = "like" | "dislike";
export type CommunityReviewSort = "rating_desc" | "rating_asc" | "newest" | "oldest";

export type CommunityAuthor = {
  user_id?: string | null;
  display_name: string;
  email?: string | null;
  avatar_data_url?: string | null;
  is_verified: boolean;
  role_tag?: string | null;
  is_admin: boolean;
};

export type CommunityMemberProfile = {
  user_id: string;
  email: string;
  display_name: string;
  avatar_data_url?: string | null;
  is_verified: boolean;
  role_tag?: string | null;
  is_admin: boolean;
  is_root_admin: boolean;
};

export type CommunityViewerContext = {
  authenticated: boolean;
  profile?: CommunityMemberProfile | null;
};

export type CommunityComment = {
  id: string;
  discussion_id: string;
  parent_id?: string | null;
  author: CommunityAuthor;
  body: string;
  like_count: number;
  dislike_count: number;
  viewer_reaction?: CommunityReaction | null;
  created_at: string;
  replies: CommunityComment[];
};

export type CommunityDiscussion = {
  id: string;
  product: CommunityProduct;
  category: CommunityDiscussionCategory;
  author: CommunityAuthor;
  title: string;
  body: string;
  image_data_url?: string | null;
  like_count: number;
  viewer_reaction?: "like" | null;
  comment_count: number;
  created_at: string;
  updated_at: string;
  comments: CommunityComment[];
};

export type CommunityReview = {
  id: string;
  product: CommunityProduct;
  author: CommunityAuthor;
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

export type CommunityAdminContext = {
  profile: CommunityMemberProfile;
};

export type CommunityMessageResponse = {
  message: string;
};

export type CommunityPublicationAdminBlock = {
  kind: string;
  value?: string | null;
  url?: string | null;
  caption?: string | null;
  title?: string | null;
};

export type CommunityPublicationAdmin = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: PublicPublicationCategory;
  status: "draft" | "published";
  preview_image_url?: string | null;
  preview_video_url?: string | null;
  body_blocks: CommunityPublicationAdminBlock[];
  published_at?: string | null;
  created_at: string;
  updated_at: string;
};

export async function getCommunityViewerContext(): Promise<CommunityViewerContext> {
  return apiFetch("/public/community/context");
}

export async function listCommunityDiscussions(filters: {
  product?: CommunityProduct;
  category?: CommunityDiscussionCategory;
  search?: string;
} = {}): Promise<CommunityDiscussion[]> {
  const params = new URLSearchParams();
  if (filters.product) params.set("product", filters.product);
  if (filters.category) params.set("category", filters.category);
  if (filters.search?.trim()) params.set("search", filters.search.trim());
  const query = params.toString();
  const response = await apiFetch<{ items: CommunityDiscussion[] }>(
    `/public/community/discussions${query ? `?${query}` : ""}`,
  );
  return response.items;
}

export async function createCommunityDiscussion(payload: {
  product: CommunityProduct;
  category: CommunityDiscussionCategory;
  title: string;
  body: string;
  imageDataUrl?: string | null;
}): Promise<CommunityDiscussion> {
  return apiFetch("/public/community/discussions", {
    method: "POST",
    body: JSON.stringify({
      product: payload.product,
      category: payload.category,
      title: payload.title,
      body: payload.body,
      image_data_url: payload.imageDataUrl ?? null,
    }),
  });
}

export async function createCommunityComment(
  discussionId: string,
  payload: { body: string; parentId?: string },
): Promise<CommunityComment> {
  return apiFetch(`/public/community/discussions/${discussionId}/comments`, {
    method: "POST",
    body: JSON.stringify({
      body: payload.body,
      parent_id: payload.parentId ?? null,
    }),
  });
}

export async function reactToCommunityDiscussion(
  discussionId: string,
): Promise<{ id: string; like_count: number; dislike_count: number; viewer_reaction?: "like" | null }> {
  return apiFetch(`/public/community/discussions/${discussionId}/reaction`, {
    method: "POST",
    body: JSON.stringify({ reaction: "like" }),
  });
}

export async function reactToCommunityComment(
  commentId: string,
  reaction: CommunityReaction,
): Promise<{ id: string; like_count: number; dislike_count: number; viewer_reaction?: CommunityReaction | null }> {
  return apiFetch(`/public/community/comments/${commentId}/reaction`, {
    method: "POST",
    body: JSON.stringify({ reaction }),
  });
}

export async function listCommunityReviews(
  product: CommunityProduct,
  sortBy: CommunityReviewSort = "newest",
): Promise<{
  summary: CommunityReviewSummary;
  items: CommunityReview[];
}> {
  return apiFetch(`/public/community/reviews?product=${product}&sort_by=${sortBy}`);
}

export async function createCommunityReview(payload: {
  product: CommunityProduct;
  rating: number;
  advantages: string;
  disadvantages: string;
  body?: string;
}): Promise<CommunityReview> {
  return apiFetch("/public/community/reviews", {
    method: "POST",
    body: JSON.stringify({
      product: payload.product,
      rating: payload.rating,
      advantages: payload.advantages,
      disadvantages: payload.disadvantages,
      body: payload.body ?? null,
    }),
  });
}

export async function getCommunityAdminContext(): Promise<CommunityAdminContext> {
  return apiFetch("/public/community/admin/context");
}

export async function listCommunityMembers(query?: string): Promise<CommunityMemberProfile[]> {
  const suffix = query?.trim() ? `?query=${encodeURIComponent(query.trim())}` : "";
  const response = await apiFetch<{ items: CommunityMemberProfile[] }>(`/public/community/admin/members${suffix}`);
  return response.items;
}

export async function updateCommunityMember(
  userId: string,
  payload: { isVerified: boolean; roleTag?: string | null; isAdmin: boolean },
): Promise<CommunityMemberProfile> {
  return apiFetch(`/public/community/admin/members/${encodeURIComponent(userId)}`, {
    method: "PUT",
    body: JSON.stringify({
      is_verified: payload.isVerified,
      role_tag: payload.roleTag ?? null,
      is_admin: payload.isAdmin,
    }),
  });
}

export async function deleteCommunityDiscussion(discussionId: string): Promise<CommunityMessageResponse> {
  return apiFetch(`/public/community/admin/discussions/${encodeURIComponent(discussionId)}`, {
    method: "DELETE",
  });
}

export async function deleteCommunityComment(commentId: string): Promise<CommunityMessageResponse> {
  return apiFetch(`/public/community/admin/comments/${encodeURIComponent(commentId)}`, {
    method: "DELETE",
  });
}

export async function deleteCommunityReview(reviewId: string): Promise<CommunityMessageResponse> {
  return apiFetch(`/public/community/admin/reviews/${encodeURIComponent(reviewId)}`, {
    method: "DELETE",
  });
}

export async function listCommunityAdminPublications(): Promise<CommunityPublicationAdmin[]> {
  const response = await apiFetch<{ items: CommunityPublicationAdmin[] }>("/public/community/admin/publications");
  return response.items;
}

export async function createCommunityPublication(
  payload: Omit<CommunityPublicationAdmin, "id" | "created_at" | "updated_at">,
): Promise<CommunityPublicationAdmin> {
  return apiFetch("/public/community/admin/publications", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCommunityPublication(
  publicationId: string,
  payload: Omit<CommunityPublicationAdmin, "id" | "created_at" | "updated_at">,
): Promise<CommunityPublicationAdmin> {
  return apiFetch(`/public/community/admin/publications/${encodeURIComponent(publicationId)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteCommunityPublication(publicationId: string): Promise<CommunityMessageResponse> {
  return apiFetch(`/public/community/admin/publications/${encodeURIComponent(publicationId)}`, {
    method: "DELETE",
  });
}
