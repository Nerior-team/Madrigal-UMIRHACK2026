import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../core";
import { ApiError } from "../core/http";
import { PlatformAuthLayout } from "./components/PlatformAuthLayout";
import { platformAuthPath, type PlatformAuthMode } from "./auth-routes";
import {
  clearPlatformPendingChallenge,
  clearPlatformPendingEmail,
  getPlatformPendingChallenge,
  getPlatformPendingEmail,
  setPlatformPendingChallenge,
  setPlatformPendingEmail,
} from "./auth-storage";
import { usePlatformSession } from "./session";

type PlatformAuthPageProps = {
  mode: PlatformAuthMode;
};

function readNextPath(location: ReturnType<typeof useLocation>): string {
  if (
    typeof location.state === "object" &&
    location.state !== null &&
    "next" in location.state &&
    typeof (location.state as { next?: unknown }).next === "string"
  ) {
    return (location.state as { next: string }).next;
  }
  return "/";
}

function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.body.trim()) {
    return error.body;
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

function validatePlatformPassword(password: string): string[] {
  const issues: string[] = [];
  if (password.length < 12) issues.push("Используйте минимум 12 символов.");
  if (!/[a-z]/.test(password)) issues.push("Добавьте строчную букву.");
  if (!/[A-Z]/.test(password)) issues.push("Добавьте заглавную букву.");
  if (!/\d/.test(password)) issues.push("Добавьте цифру.");
  if (!/[^A-Za-z0-9]/.test(password)) issues.push("Добавьте специальный символ.");
  return issues;
}

export function PlatformAuthPage({ mode }: PlatformAuthPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshSession } = usePlatformSession();

  const [email, setEmail] = useState(() => getPlatformPendingEmail());
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextPath = useMemo(() => readNextPath(location), [location]);

  const title =
    mode === "login"
      ? "Вход в Nerior API"
      : mode === "register"
        ? "Создание API-аккаунта"
        : mode === "verify"
          ? "Подтверждение доступа"
          : mode === "forgot-password"
            ? "Сброс пароля"
            : "Новый пароль";

  const subtitle =
    mode === "login"
      ? "API использует отдельный вход и отдельную сессию."
      : mode === "register"
        ? "Создайте доступ для API-ключей, продуктовых scope и usage-аналитики."
        : mode === "verify"
          ? "Введите код из письма или код двухфакторной проверки."
          : mode === "forgot-password"
            ? "Мы отправим ссылку для сброса на вашу почту."
            : "Используйте токен из письма, чтобы задать новый пароль.";

  const handleLoginSubmit = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      setError("Введите email и пароль.");
      return;
    }

    const response = await api.login(normalizedEmail, password);
    if (response.requiresConfirmation) {
      setPlatformPendingEmail(normalizedEmail);
      setPlatformPendingChallenge(response.challengeId ?? null);
      navigate(platformAuthPath("verify"), { replace: true, state: { next: nextPath } });
      return;
    }

    clearPlatformPendingChallenge();
    clearPlatformPendingEmail();
    await refreshSession();
    navigate(nextPath, { replace: true });
  };

  const handleRegisterSubmit = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password || !confirmPassword) {
      setError("Заполните все обязательные поля.");
      return;
    }
    if (!acceptTerms) {
      setError("Подтвердите согласие с условиями.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Подтверждение пароля не совпадает.");
      return;
    }

    const issues = validatePlatformPassword(password);
    if (issues.length) {
      setError(issues[0] ?? "Пароль не соответствует политике.");
      return;
    }

    await api.register(normalizedEmail, password);
    setPlatformPendingEmail(normalizedEmail);
    setPlatformPendingChallenge(null);
    setNotice("Код подтверждения отправлен. Завершите верификацию email.");
    navigate(platformAuthPath("verify"), { replace: true, state: { next: nextPath } });
  };

  const handleVerifySubmit = async () => {
    const pendingEmail = email.trim() || getPlatformPendingEmail();
    if (!pendingEmail || !verificationCode.trim()) {
      setError("Введите email и код подтверждения.");
      return;
    }

    await api.confirm(
      pendingEmail,
      verificationCode.trim(),
      getPlatformPendingChallenge() ?? undefined,
    );
    clearPlatformPendingChallenge();
    clearPlatformPendingEmail();
    await refreshSession();
    navigate(nextPath, { replace: true });
  };

  const handleForgotPasswordSubmit = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError("Введите email.");
      return;
    }
    const response = await api.forgotPassword(normalizedEmail);
    setNotice(response.message);
  };

  const handleResetPasswordSubmit = async () => {
    if (!resetToken.trim() || !password || !confirmPassword) {
      setError("Введите токен сброса и новый пароль.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Подтверждение пароля не совпадает.");
      return;
    }
    const issues = validatePlatformPassword(password);
    if (issues.length) {
      setError(issues[0] ?? "Пароль не соответствует политике.");
      return;
    }

    const response = await api.resetPassword(resetToken.trim(), password);
    setNotice(response.message);
    navigate(platformAuthPath("login"), { replace: true });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === "login") {
        await handleLoginSubmit();
      } else if (mode === "register") {
        await handleRegisterSubmit();
      } else if (mode === "verify") {
        await handleVerifySubmit();
      } else if (mode === "forgot-password") {
        await handleForgotPasswordSubmit();
      } else {
        await handleResetPasswordSubmit();
      }
    } catch (submitError) {
      setError(
        extractApiErrorMessage(
          submitError,
          mode === "register"
            ? "Не удалось создать аккаунт."
            : mode === "verify"
              ? "Не удалось подтвердить аккаунт."
              : mode === "forgot-password"
                ? "Не удалось отправить письмо для сброса."
                : mode === "reset-password"
                  ? "Не удалось сбросить пароль."
                  : "Не удалось выполнить вход.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PlatformAuthLayout>
      <div className="platform-auth-card">
        <span className="platform-eyebrow">Access</span>
        <h2>{title}</h2>
        <p>{subtitle}</p>

        <form className="platform-auth-form" onSubmit={handleSubmit}>
          {(mode === "login" ||
            mode === "register" ||
            mode === "verify" ||
            mode === "forgot-password") && (
            <label className="platform-field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.com"
              />
            </label>
          )}

          {(mode === "login" || mode === "register" || mode === "reset-password") && (
            <label className="platform-field">
              <span>{mode === "reset-password" ? "Новый пароль" : "Пароль"}</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Введите пароль"
              />
            </label>
          )}

          {mode === "register" || mode === "reset-password" ? (
            <label className="platform-field">
              <span>Подтвердите пароль</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Повторите пароль"
              />
            </label>
          ) : null}

          {mode === "verify" ? (
            <label className="platform-field">
              <span>Код подтверждения</span>
              <input
                type="text"
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value)}
                placeholder="123456"
              />
            </label>
          ) : null}

          {mode === "reset-password" ? (
            <label className="platform-field">
              <span>Токен сброса</span>
              <input
                type="text"
                value={resetToken}
                onChange={(event) => setResetToken(event.target.value)}
                placeholder="Вставьте токен из письма"
              />
            </label>
          ) : null}

          {mode === "register" ? (
            <label className="platform-auth-form__checkbox">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(event) => setAcceptTerms(event.target.checked)}
              />
              <span>Я принимаю условия и политику конфиденциальности.</span>
            </label>
          ) : null}

          {notice ? <p className="platform-feedback platform-feedback--notice">{notice}</p> : null}
          {error ? <p className="platform-feedback platform-feedback--error">{error}</p> : null}

          {mode === "register" ? (
            <div className="platform-auth-form__hint">
              Требования к паролю:
              <ul className="platform-list">
                {validatePlatformPassword(password || "short").map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <button type="submit" className="platform-button platform-button--primary" disabled={isSubmitting}>
            {isSubmitting
              ? "Подождите..."
              : mode === "login"
                ? "Войти"
                : mode === "register"
                  ? "Создать аккаунт"
                  : mode === "verify"
                    ? "Подтвердить"
                    : mode === "forgot-password"
                      ? "Отправить ссылку"
                      : "Обновить пароль"}
          </button>
        </form>

        <div className="platform-auth-card__links">
          {mode !== "login" ? <Link to={platformAuthPath("login")}>Войти</Link> : null}
          {mode !== "register" ? <Link to={platformAuthPath("register")}>Создать аккаунт</Link> : null}
          {mode !== "forgot-password" ? (
            <Link to={platformAuthPath("forgot-password")}>Забыли пароль?</Link>
          ) : null}
        </div>
      </div>
    </PlatformAuthLayout>
  );
}
