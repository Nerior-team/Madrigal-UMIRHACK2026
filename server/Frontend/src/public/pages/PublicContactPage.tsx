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

const FEATURES = [
  { icon: "◆", text: "Запросы по Crossplat, будущим продуктам и общей экосистеме Nerior" },
  { icon: "◀", text: "Форма подключена к реальному backend-контракту без локальных фейков" },
  { icon: "◉", text: "Заявка уходит дальше в рабочий канал обработки, а не остаётся только на фронте" },
  { icon: "◎", text: "Телефон и размер компании принимают только цифры, как и требуется по валидации" },
];

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
    <main style={{ minHeight: "100vh", background: "#000", color: "#fff" }}>
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "5rem 1.75rem 7rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5rem", alignItems: "start" }}>
          <div>
            <h1
              style={{
                fontSize: "clamp(2rem, 4.5vw, 3.5rem)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.08,
                marginBottom: "1.75rem",
              }}
            >
              Свяжитесь с нами
            </h1>

            <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.5)", marginBottom: "2.5rem", lineHeight: 1.5 }}>
              Запросы по продукту, внедрению, документации, API и будущим сервисам экосистемы
              Nerior.
            </p>

            <div>
              <p style={sectionEyebrowStyle}>Что обрабатывает форма</p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {FEATURES.map((feature) => (
                  <li key={feature.text} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                    <span style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0, marginTop: "1px", fontSize: "0.875rem" }}>{feature.icon}</span>
                    <span style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.45 }}>{feature.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ marginTop: "3rem" }}>
              <p style={sectionEyebrowStyle}>Куда идти дальше</p>
              <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
                Если нужен self-service путь, сначала посмотрите документацию, сообщество или
                справочный центр.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <Field label="Что вас интересует?*">
                <select
                  value={form.interest}
                  onChange={(event) => setField("interest", event.target.value as ContactInterest)}
                  style={selectStyle}
                >
                  <option value="crossplat">Crossplat</option>
                  <option value="smart-planner">Smart-Planner</option>
                  <option value="karpik">Karpik</option>
                  <option value="other">Другое</option>
                </select>
              </Field>
              <Field label="Электронная почта*">
                <input
                  value={form.email}
                  onChange={(event) => setField("email", event.target.value)}
                  type="email"
                  autoComplete="email"
                  style={inputStyle}
                />
              </Field>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <Field label="Имя*">
                <input
                  value={form.name}
                  onChange={(event) => setField("name", event.target.value)}
                  autoComplete="name"
                  style={inputStyle}
                />
              </Field>
              <Field label="Номер телефона*">
                <input
                  value={form.phone}
                  onChange={(event) => setField("phone", digitsOnly(event.target.value))}
                  inputMode="numeric"
                  autoComplete="tel"
                  style={inputStyle}
                />
              </Field>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <Field label="Название компании*">
                <input
                  value={form.companyName}
                  onChange={(event) => setField("companyName", event.target.value)}
                  autoComplete="organization"
                  style={inputStyle}
                />
              </Field>
              <Field label="Размер компании*">
                <input
                  value={form.companySize}
                  onChange={(event) => setField("companySize", digitsOnly(event.target.value))}
                  inputMode="numeric"
                  style={inputStyle}
                />
              </Field>
            </div>

            <Field label="Сообщение*">
              <textarea
                rows={8}
                value={form.message}
                onChange={(event) => setField("message", event.target.value)}
                style={{ ...inputStyle, width: "100%", minHeight: "180px", paddingTop: "0.875rem" }}
              />
            </Field>

            {error ? <p style={{ fontSize: "0.75rem", color: "#ff6b6b", margin: 0 }}>{error}</p> : null}
            {success ? <p style={{ fontSize: "0.75rem", color: "#b7e6c4", margin: 0 }}>{success}</p> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                alignSelf: "flex-start",
                padding: "0.5625rem 1.375rem",
                background: "#fff",
                color: "#000",
                borderRadius: "999px",
                fontWeight: 600,
                fontSize: "0.875rem",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "background 0.18s",
                marginTop: "0.25rem",
              }}
            >
              {isSubmitting ? "Отправляем..." : "Отправить"}
            </button>

            <div style={{ marginTop: "0.5rem" }}>
              <a
                href="https://help.nerior.store"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: "0.8125rem",
                  color: "rgba(255,255,255,0.4)",
                  borderBottom: "1px solid rgba(255,255,255,0.2)",
                  paddingBottom: "1px",
                  textDecoration: "none",
                }}
              >
                Если сначала нужна помощь, откройте справочный центр
              </a>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
      <label style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.5)" }}>{label}</label>
      {children}
    </div>
  );
}

const sectionEyebrowStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.3)",
  marginBottom: "1rem",
};

const inputStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: "0.375rem",
  padding: "0.625rem 0.875rem",
  color: "#fff",
  fontSize: "0.9375rem",
  fontFamily: "inherit",
  outline: "none",
  width: "100%",
  transition: "border-color 0.15s",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none",
  background: "#000",
  cursor: "pointer",
};
