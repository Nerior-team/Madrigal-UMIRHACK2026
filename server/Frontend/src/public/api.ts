import { apiFetch } from "../core/http";

export type PublicContactPayload = {
  interest: "crossplat" | "smart-planner" | "karpik" | "other";
  name: string;
  email: string;
  phone: string;
  companyName: string;
  companySize: string;
  message: string;
};

export async function submitPublicContact(payload: PublicContactPayload): Promise<{ detail: string }> {
  return apiFetch("/public/contact", {
    method: "POST",
    body: JSON.stringify({
      interest: payload.interest,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      company_name: payload.companyName,
      company_size: payload.companySize,
      message: payload.message,
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
