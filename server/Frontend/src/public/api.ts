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
