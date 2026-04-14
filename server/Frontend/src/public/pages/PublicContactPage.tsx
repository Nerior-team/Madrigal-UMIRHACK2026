import { useState } from "react";
import { submitPublicContact } from "../api";

type ContactInterest = "crossplat" | "smart-planner" | "karpik" | "other";

type FormState = {
  interest: ContactInterest;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  companySize: string;
  message: string;
};

const INITIAL_STATE: FormState = { interest: "crossplat", name: "", email: "", phone: "", companyName: "", companySize: "", message: "" };

function digitsOnly(value: string): string {
  return value.replace(/\D+/g, "");
}

export function PublicContactPage() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function setField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.companyName.trim() || !form.companySize.trim() || !form.message.trim()) {
      setError("\u0417\u0430\u043f\u043e\u043b\u043d\u0438\u0442\u0435 \u0432\u0441\u0435 \u043f\u043e\u043b\u044f \u0444\u043e\u0440\u043c\u044b.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await submitPublicContact(form);
      setSuccess(response.detail);
      setForm(INITIAL_STATE);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c \u0437\u0430\u043f\u0440\u043e\u0441.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return <main className="public-page"><section className="public-contact-shell"><div className="public-contact-aside"><div className="public-section__header public-section__header--contact"><div><span className="public-eyebrow">{"\u0421\u0432\u044f\u0437\u0430\u0442\u044c\u0441\u044f \u0441 \u043d\u0430\u043c\u0438"}</span><h1>{"\u041e\u0441\u0442\u0430\u0432\u044c\u0442\u0435 \u0437\u0430\u043f\u0440\u043e\u0441 \u043f\u043e \u043f\u0440\u043e\u0434\u0443\u043a\u0442\u0443, \u0432\u043d\u0435\u0434\u0440\u0435\u043d\u0438\u044e \u0438\u043b\u0438 \u0431\u0443\u0434\u0443\u0449\u0435\u043c\u0443 \u0441\u043e\u0442\u0440\u0443\u0434\u043d\u0438\u0447\u0435\u0441\u0442\u0432\u0443."}</h1><p>{"\u0424\u043e\u0440\u043c\u0430 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0435\u0442 \u0440\u0435\u0430\u043b\u044c\u043d\u044b\u0439 backend-\u043a\u043e\u043d\u0442\u0440\u0430\u043a\u0442 \u0438 \u0443\u0445\u043e\u0434\u0438\u0442 \u0432 \u0440\u0430\u0431\u043e\u0447\u0438\u0439 \u043a\u0430\u043d\u0430\u043b \u043e\u0431\u0440\u0430\u0431\u043e\u0442\u043a\u0438 \u0437\u0430\u044f\u0432\u043e\u043a. \u0421\u044e\u0434\u0430 \u0441\u0442\u043e\u0438\u0442 \u043f\u0438\u0441\u0430\u0442\u044c \u043f\u043e \u043f\u0440\u043e\u0434\u0443\u043a\u0442\u0443, API, \u0438\u043d\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u0438, \u0431\u0443\u0434\u0443\u0449\u0438\u043c \u043f\u0440\u043e\u0435\u043a\u0442\u0430\u043c \u0438 \u043e\u0431\u0449\u0438\u043c \u0432\u043e\u043f\u0440\u043e\u0441\u0430\u043c \u043f\u043e \u044d\u043a\u043e\u0441\u0438\u0441\u0442\u0435\u043c\u0435 Nerior."}</p></div></div><div className="public-feature-grid public-feature-grid--compact"><article className="public-feature-card"><h2>Crossplat</h2><p>{"\u0417\u0430\u043f\u0440\u043e\u0441\u044b \u043f\u043e \u0430\u043a\u0442\u0438\u0432\u043d\u043e\u043c\u0443 \u043f\u0440\u043e\u0434\u0443\u043a\u0442\u0443, \u0440\u0430\u0431\u043e\u0447\u0438\u043c \u0441\u0446\u0435\u043d\u0430\u0440\u0438\u044f\u043c, \u0434\u0435\u043c\u043e\u043d\u0441\u0442\u0440\u0430\u0446\u0438\u044f\u043c \u0438 \u0432\u043d\u0435\u0434\u0440\u0435\u043d\u0438\u044e."}</p></article><article className="public-feature-card"><h2>{"\u0411\u0443\u0434\u0443\u0449\u0438\u0435 \u043f\u0440\u043e\u0434\u0443\u043a\u0442\u044b"}</h2><p>{"Smart-Planner \u0438 Karpik \u0443\u0436\u0435 \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u044b \u0432 \u0444\u043e\u0440\u043c\u0435 \u043a\u0430\u043a \u043e\u0442\u0434\u0435\u043b\u044c\u043d\u044b\u0435 \u043d\u0430\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u044f \u0438\u043d\u0442\u0435\u0440\u0435\u0441\u0430."}</p></article><article className="public-feature-card"><h2>{"\u0420\u0435\u0430\u043b\u044c\u043d\u0430\u044f \u043e\u0442\u043f\u0440\u0430\u0432\u043a\u0430"}</h2><p>{"\u041d\u0438\u043a\u0430\u043a\u0438\u0445 \u043b\u043e\u043a\u0430\u043b\u044c\u043d\u044b\u0445 \u0444\u0435\u0439\u043a\u043e\u0432: \u0444\u043e\u0440\u043c\u0430 \u043e\u0442\u043f\u0440\u0430\u0432\u043b\u044f\u0435\u0442\u0441\u044f \u0447\u0435\u0440\u0435\u0437 \u0442\u0435\u043a\u0443\u0449\u0438\u0439 backend \u0438 \u0434\u0430\u043b\u044c\u0448\u0435 \u043e\u0431\u0440\u0430\u0431\u0430\u0442\u044b\u0432\u0430\u0435\u0442\u0441\u044f \u0432 \u0440\u0430\u0431\u043e\u0447\u0435\u043c \u043a\u043e\u043d\u0442\u0443\u0440\u0435."}</p></article></div></div><form className="public-contact-form-card" onSubmit={handleSubmit}><div className="public-contact-form"><label className="public-field public-field--full"><span>{"\u0427\u0442\u043e \u0432\u0430\u0441 \u0438\u043d\u0442\u0435\u0440\u0435\u0441\u0443\u0435\u0442?"}</span><select value={form.interest} onChange={(event) => setField("interest", event.target.value as ContactInterest)}><option value="crossplat">Crossplat</option><option value="smart-planner">Smart-Planner</option><option value="karpik">Karpik</option><option value="other">{"\u0414\u0440\u0443\u0433\u043e\u0435"}</option></select></label><label className="public-field"><span>{"\u0418\u043c\u044f"}</span><input value={form.name} onChange={(event) => setField("name", event.target.value)} autoComplete="name" /></label><label className="public-field"><span>Email</span><input type="email" value={form.email} onChange={(event) => setField("email", event.target.value)} autoComplete="email" /></label><label className="public-field"><span>{"\u0422\u0435\u043b\u0435\u0444\u043e\u043d"}</span><input inputMode="numeric" value={form.phone} onChange={(event) => setField("phone", digitsOnly(event.target.value))} autoComplete="tel" /></label><label className="public-field"><span>{"\u041a\u043e\u043c\u043f\u0430\u043d\u0438\u044f"}</span><input value={form.companyName} onChange={(event) => setField("companyName", event.target.value)} autoComplete="organization" /></label><label className="public-field"><span>{"\u0420\u0430\u0437\u043c\u0435\u0440 \u043a\u043e\u043c\u043f\u0430\u043d\u0438\u0438"}</span><input inputMode="numeric" value={form.companySize} onChange={(event) => setField("companySize", digitsOnly(event.target.value))} /></label><label className="public-field public-field--full"><span>{"\u0421\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435"}</span><textarea rows={8} value={form.message} onChange={(event) => setField("message", event.target.value)} /></label></div><div className="public-contact-form__footer"><div className="public-contact-form__status">{error ? <p className="public-form-feedback public-form-feedback--error">{error}</p> : null}{success ? <p className="public-form-feedback public-form-feedback--success">{success}</p> : null}</div><button type="submit" className="public-button public-button--solid" disabled={isSubmitting}>{isSubmitting ? "\u041e\u0442\u043f\u0440\u0430\u0432\u043b\u044f\u0435\u043c..." : "\u041e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c \u0437\u0430\u043f\u0440\u043e\u0441"}</button></div></form></section></main>;
}
