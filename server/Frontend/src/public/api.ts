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
