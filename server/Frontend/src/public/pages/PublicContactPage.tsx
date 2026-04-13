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

const INITIAL_STATE: FormState = {
  interest: "crossplat",
  name: "",
  email: "",
  phone: "",
  companyName: "",
  companySize: "",
  message: "",
};

export function PublicContactPage() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function setField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function digitsOnly(value: string): string {
    return value.replace(/\D+/g, "");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.companyName.trim() ||
      !form.companySize.trim() ||
      !form.message.trim()
    ) {
      setError("Заполните все поля формы.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await submitPublicContact(form);
      setSuccess(response.detail);
      setForm(INITIAL_STATE);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не удалось отправить запрос.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="public-page">
      <section className="public-section">
        <div className="public-section__header">
          <div>
            <span className="public-eyebrow">Связаться с нами</span>
            <h1>Оставьте запрос по продукту, внедрению или будущему сотрудничеству.</h1>
            <p>
              Форма отправляется в реальный backend и приходит на рабочую почту в нормальном
              читаемом формате.
            </p>
          </div>
        </div>

        <div className="public-feature-grid">
          <article className="public-feature-card">
            <h2>Crossplat</h2>
            <p>Запросы по текущему активному продукту, демонстрациям и рабочим сценариям.</p>
          </article>
          <article className="public-feature-card">
            <h2>Будущие продукты</h2>
            <p>Smart-Planner и Karpik уже доступны в форме как отдельные направления интереса.</p>
          </article>
          <article className="public-feature-card">
            <h2>Реальная отправка</h2>
            <p>Никаких моков: форма уходит через текущий backend-контракт и почтовую доставку.</p>
          </article>
        </div>

        <form className="public-contact-form" onSubmit={handleSubmit}>
          <label className="public-field">
            <span>Что вас интересует?</span>
            <select
              value={form.interest}
              onChange={(event) => setField("interest", event.target.value as ContactInterest)}
            >
              <option value="crossplat">Crossplat</option>
              <option value="smart-planner">Smart-Planner</option>
              <option value="karpik">Karpik</option>
              <option value="other">Другое</option>
            </select>
          </label>

          <label className="public-field">
            <span>Имя</span>
            <input
              value={form.name}
              onChange={(event) => setField("name", event.target.value)}
              autoComplete="name"
            />
          </label>

          <label className="public-field">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setField("email", event.target.value)}
              autoComplete="email"
            />
          </label>

          <label className="public-field">
            <span>Телефон</span>
            <input
              inputMode="numeric"
              value={form.phone}
              onChange={(event) => setField("phone", digitsOnly(event.target.value))}
              autoComplete="tel"
            />
          </label>

          <label className="public-field">
            <span>Компания</span>
            <input
              value={form.companyName}
              onChange={(event) => setField("companyName", event.target.value)}
              autoComplete="organization"
            />
          </label>

          <label className="public-field">
            <span>Размер компании</span>
            <input
              inputMode="numeric"
              value={form.companySize}
              onChange={(event) => setField("companySize", digitsOnly(event.target.value))}
            />
          </label>

          <label className="public-field public-field--full">
            <span>Сообщение</span>
            <textarea
              rows={8}
              value={form.message}
              onChange={(event) => setField("message", event.target.value)}
            />
          </label>

          <div className="public-contact-form__footer">
            {error ? <p className="public-form-feedback public-form-feedback--error">{error}</p> : null}
            {success ? <p className="public-form-feedback public-form-feedback--success">{success}</p> : null}
            <button
              type="submit"
              className="public-button public-button--solid"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Отправляем..." : "Отправить запрос"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
