import { useState } from "react";
import { submitPublicContact } from "../api";

type ContactMode = "client" | "business";
type ContactInterest = "crossplat" | "smart-planner" | "karpik" | "other";

type FormState = {
  interest: ContactInterest;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  companySize: string;
  message: string;
  marketing: boolean;
};

const INITIAL_STATE: FormState = {
  interest: "crossplat",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  companyName: "",
  companySize: "",
  message: "",
  marketing: true,
};

const CLIENT_FEATURES = [
  "Подходит для личных запросов по продуктам Nerior и будущим сервисам экосистемы.",
  "Помогает быстро получить ответ по возможностям, подключению и доступным сценариям.",
  "Удобен, если вы хотите уточнить детали по Crossplat, Smart-Planner или Karpik без корпоративного процесса закупки.",
];

const BUSINESS_FEATURES = [
  "Подходит для внедрения, пилотов, интеграций и обсуждения бизнес-сценариев.",
  "Позволяет сразу передать данные о компании и масштабе команды, чтобы ответ был предметным.",
  "Удобен для запросов по API, процессам согласования и совместной работе с продуктовой командой.",
];

export function PublicContactPage() {
  const [mode, setMode] = useState<ContactMode>("client");
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function setField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function digitsOnly(value: string): string {
    return value.replace(/\D+/g, "");
  }

  function validate(currentMode: ContactMode, state: FormState): Record<string, string> {
    const nextErrors: Record<string, string> = {};

    if (!state.interest) nextErrors.interest = "Выберите направление.";
    if (!state.firstName.trim()) nextErrors.firstName = "Укажите имя.";
    if (!state.lastName.trim()) nextErrors.lastName = "Укажите фамилию.";
    if (!state.email.trim()) nextErrors.email = "Укажите email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) nextErrors.email = "Укажите корректный email.";
    if (!state.phone.trim()) nextErrors.phone = "Укажите номер телефона.";
    else if (!/^\d+$/.test(state.phone)) nextErrors.phone = "Номер телефона должен содержать только цифры.";
    if (!state.message.trim()) nextErrors.message = "Добавьте сообщение.";
    else if (state.message.trim().length < 10) nextErrors.message = "Сообщение должно быть подробнее.";

    if (currentMode === "business") {
      if (!state.companyName.trim()) nextErrors.companyName = "Укажите название компании.";
      if (!state.companySize.trim()) nextErrors.companySize = "Укажите размер компании.";
      else if (!/^\d+$/.test(state.companySize)) nextErrors.companySize = "Размер компании должен содержать только цифры.";
    }

    return nextErrors;
  }

  function resolveSubmitError(submitError: unknown): string {
    if (!(submitError instanceof Error)) {
      return "Не удалось отправить запрос.";
    }

    try {
      const parsed = JSON.parse(submitError.message) as {
        detail?: string;
        message?: string;
        error?: { message?: string };
      };
      return parsed.detail ?? parsed.message ?? parsed.error?.message ?? submitError.message;
    } catch {
      return submitError.message;
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const nextErrors = validate(mode, form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await submitPublicContact({
        mode,
        interest: form.interest,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        companyName: mode === "business" ? form.companyName : undefined,
        companySize: mode === "business" ? form.companySize : undefined,
        message: form.message,
        marketing: form.marketing,
      });
      setSuccess(response.detail);
      setForm({
        ...INITIAL_STATE,
        interest: form.interest,
      });
      setErrors({});
    } catch (submitError) {
      setError(resolveSubmitError(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  const features = mode === "client" ? CLIENT_FEATURES : BUSINESS_FEATURES;
  const title = mode === "client" ? "Свяжитесь с нами" : "Свяжитесь с нами по бизнес-вопросам";
  const subtitle =
    mode === "client"
      ? "Форма для частных обращений по продуктам, доступу, интеграциям и вопросам по экосистеме Nerior."
      : "Форма для внедрения, партнёрств, обсуждения API, интеграций и корпоративных сценариев.";
  const messageLabel =
    mode === "client"
      ? "Расскажите, что вас интересует*"
      : "Расскажите о задачах бизнеса, интеграции или внедрении*";

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
              {title}
            </h1>

            <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.5)", marginBottom: "2.5rem", lineHeight: 1.5 }}>
              {subtitle}
            </p>

            <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.5)", marginBottom: "2.5rem", lineHeight: 1.5 }}>
              {mode === "client" ? "Вы представляете компанию?" : "Это личный запрос, а не корпоративное обращение?"}{" "}
              <button
                type="button"
                onClick={() => setMode(mode === "client" ? "business" : "client")}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  fontFamily: "inherit",
                  fontSize: "inherit",
                  cursor: "pointer",
                  color: "#fff",
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
                }}
              >
                {mode === "client" ? "Переключиться на бизнес-форму" : "Переключиться на форму для клиентов"}
              </button>
            </p>

            <div>
              <p style={sectionEyebrowStyle}>Что обрабатывает форма</p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {features.map((feature) => (
                  <li key={feature} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                    <span style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0, marginTop: "1px", fontSize: "0.875rem" }}>*</span>
                    <span style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.45 }}>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ marginTop: "3rem" }}>
              <p style={sectionEyebrowStyle}>Куда идти дальше</p>
              <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
                Если сначала нужен self-service путь, откройте документацию, сообщество или справочный центр. Если нужен ответ от команды,
                используйте форму ниже.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <Field label="Что вас интересует?*" error={errors.interest}>
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
              <Field label="Электронная почта*" error={errors.email}>
                <input
                  value={form.email}
                  onChange={(event) => setField("email", event.target.value)}
                  type="email"
                  autoComplete="email"
                  style={inputStyle}
                />
              </Field>
            </div>

            {mode === "business" ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <Field label="Размер компании*" error={errors.companySize}>
                  <input
                    value={form.companySize}
                    onChange={(event) => setField("companySize", digitsOnly(event.target.value))}
                    inputMode="numeric"
                    style={inputStyle}
                  />
                </Field>
                <Field label="Название компании*" error={errors.companyName}>
                  <input
                    value={form.companyName}
                    onChange={(event) => setField("companyName", event.target.value)}
                    autoComplete="organization"
                    style={inputStyle}
                  />
                </Field>
              </div>
            ) : null}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <Field label="Имя*" error={errors.firstName}>
                <input
                  value={form.firstName}
                  onChange={(event) => setField("firstName", event.target.value)}
                  autoComplete="given-name"
                  style={inputStyle}
                />
              </Field>
              <Field label="Фамилия*" error={errors.lastName}>
                <input
                  value={form.lastName}
                  onChange={(event) => setField("lastName", event.target.value)}
                  autoComplete="family-name"
                  style={inputStyle}
                />
              </Field>
            </div>

            <Field label="Номер телефона*" error={errors.phone}>
              <input
                value={form.phone}
                onChange={(event) => setField("phone", digitsOnly(event.target.value))}
                inputMode="numeric"
                autoComplete="tel"
                style={inputStyle}
              />
            </Field>

            <Field label={messageLabel} error={errors.message}>
              <textarea
                rows={8}
                value={form.message}
                onChange={(event) => setField("message", event.target.value)}
                style={{ ...inputStyle, width: "100%", minHeight: "180px", paddingTop: "0.875rem" }}
              />
            </Field>

            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", cursor: "pointer", marginTop: "0.25rem" }}>
              <div
                onClick={() => setField("marketing", !form.marketing)}
                style={{
                  width: "16px",
                  height: "16px",
                  background: form.marketing ? "#fff" : "transparent",
                  border: "1.5px solid rgba(255,255,255,0.5)",
                  borderRadius: "3px",
                  flexShrink: 0,
                  marginTop: "2px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {form.marketing ? (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </div>
              <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                Хочу получать письма о новых возможностях продуктов Nerior, обновлениях и мероприятиях. При необходимости эту галочку
                можно снять.
              </span>
            </label>

            {error ? <p style={{ fontSize: "0.75rem", color: "#ff6b6b", margin: 0 }}>{error}</p> : null}
            {success ? <p style={{ fontSize: "0.75rem", color: "#b7e6c4", margin: 0 }}>{success}</p> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                alignSelf: "flex-start",
                padding: "0.5625rem 1.375rem",
                background: isSubmitting ? "rgba(255,255,255,0.2)" : "#fff",
                color: isSubmitting ? "rgba(255,255,255,0.5)" : "#000",
                borderRadius: "999px",
                fontWeight: 600,
                fontSize: "0.875rem",
                border: "none",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                transition: "all 0.18s",
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
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
      <label style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.5)" }}>{label}</label>
      {children}
      {error ? <p style={{ margin: 0, fontSize: "0.75rem", color: "#ff6b6b" }}>{error}</p> : null}
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
