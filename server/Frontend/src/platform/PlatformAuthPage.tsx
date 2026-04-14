import { useMemo, useState, type FormEvent } from "react";
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
  if (password.length < 12) issues.push("\u0418\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0439\u0442\u0435 \u043c\u0438\u043d\u0438\u043c\u0443\u043c 12 \u0441\u0438\u043c\u0432\u043e\u043b\u043e\u0432.");
  if (!/[a-z]/.test(password)) issues.push("\u0414\u043e\u0431\u0430\u0432\u044c\u0442\u0435 \u0441\u0442\u0440\u043e\u0447\u043d\u0443\u044e \u0431\u0443\u043a\u0432\u0443.");
  if (!/[A-Z]/.test(password)) issues.push("\u0414\u043e\u0431\u0430\u0432\u044c\u0442\u0435 \u0437\u0430\u0433\u043b\u0430\u0432\u043d\u0443\u044e \u0431\u0443\u043a\u0432\u0443.");
  if (!/\d/.test(password)) issues.push("\u0414\u043e\u0431\u0430\u0432\u044c\u0442\u0435 \u0446\u0438\u0444\u0440\u0443.");
  if (!/[^A-Za-z0-9]/.test(password)) issues.push("\u0414\u043e\u0431\u0430\u0432\u044c\u0442\u0435 \u0441\u043f\u0435\u0446\u0438\u0430\u043b\u044c\u043d\u044b\u0439 \u0441\u0438\u043c\u0432\u043e\u043b.");
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
      ? "\u0412\u0445\u043e\u0434 \u0432 Nerior API"
      : mode === "register"
        ? "\u0421\u043e\u0437\u0434\u0430\u043d\u0438\u0435 API-\u0430\u043a\u043a\u0430\u0443\u043d\u0442\u0430"
        : mode === "verify"
          ? "\u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d\u0438\u0435 \u0434\u043e\u0441\u0442\u0443\u043f\u0430"
          : mode === "forgot-password"
            ? "\u0421\u0431\u0440\u043e\u0441 \u043f\u0430\u0440\u043e\u043b\u044f"
            : "\u041d\u043e\u0432\u044b\u0439 \u043f\u0430\u0440\u043e\u043b\u044c";

  const subtitle =
    mode === "login"
      ? "API \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0435\u0442 \u043e\u0442\u0434\u0435\u043b\u044c\u043d\u044b\u0439 \u0432\u0445\u043e\u0434 \u0438 \u043e\u0442\u0434\u0435\u043b\u044c\u043d\u0443\u044e \u0441\u0435\u0441\u0441\u0438\u044e."
      : mode === "register"
        ? "\u0421\u043e\u0437\u0434\u0430\u0439\u0442\u0435 \u0434\u043e\u0441\u0442\u0443\u043f \u0434\u043b\u044f API-\u043a\u043b\u044e\u0447\u0435\u0439, \u043f\u0440\u043e\u0434\u0443\u043a\u0442\u043e\u0432\u044b\u0445 scopes \u0438 \u0430\u043d\u0430\u043b\u0438\u0442\u0438\u043a\u0438 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u044f."
        : mode === "verify"
          ? "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043a\u043e\u0434 \u0438\u0437 \u043f\u0438\u0441\u044c\u043c\u0430 \u0438\u043b\u0438 \u043a\u043e\u0434 \u0434\u0432\u0443\u0445\u0444\u0430\u043a\u0442\u043e\u0440\u043d\u043e\u0439 \u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0438."
          : mode === "forgot-password"
            ? "\u041c\u044b \u043e\u0442\u043f\u0440\u0430\u0432\u0438\u043c \u0441\u0441\u044b\u043b\u043a\u0443 \u0434\u043b\u044f \u0441\u0431\u0440\u043e\u0441\u0430 \u043d\u0430 \u0432\u0430\u0448\u0443 \u043f\u043e\u0447\u0442\u0443."
            : "\u0418\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0439\u0442\u0435 \u0442\u043e\u043a\u0435\u043d \u0438\u0437 \u043f\u0438\u0441\u044c\u043c\u0430, \u0447\u0442\u043e\u0431\u044b \u0437\u0430\u0434\u0430\u0442\u044c \u043d\u043e\u0432\u044b\u0439 \u043f\u0430\u0440\u043e\u043b\u044c.";

  const handleLoginSubmit = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      setError("\u0412\u0432\u0435\u0434\u0438\u0442\u0435 email \u0438 \u043f\u0430\u0440\u043e\u043b\u044c.");
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
      setError("\u0417\u0430\u043f\u043e\u043b\u043d\u0438\u0442\u0435 \u0432\u0441\u0435 \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u044b\u0435 \u043f\u043e\u043b\u044f.");
      return;
    }
    if (!acceptTerms) {
      setError("\u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0435 \u0441\u043e\u0433\u043b\u0430\u0441\u0438\u0435 \u0441 \u0443\u0441\u043b\u043e\u0432\u0438\u044f\u043c\u0438.");
      return;
    }
    if (password !== confirmPassword) {
      setError("\u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d\u0438\u0435 \u043f\u0430\u0440\u043e\u043b\u044f \u043d\u0435 \u0441\u043e\u0432\u043f\u0430\u0434\u0430\u0435\u0442.");
      return;
    }

    const issues = validatePlatformPassword(password);
    if (issues.length) {
      setError(issues[0] ?? "\u041f\u0430\u0440\u043e\u043b\u044c \u043d\u0435 \u0441\u043e\u043e\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0443\u0435\u0442 \u043f\u043e\u043b\u0438\u0442\u0438\u043a\u0435.");
      return;
    }

    await api.register(normalizedEmail, password);
    setPlatformPendingEmail(normalizedEmail);
    setPlatformPendingChallenge(null);
    setNotice("\u041a\u043e\u0434 \u043f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d\u0438\u044f \u043e\u0442\u043f\u0440\u0430\u0432\u043b\u0435\u043d. \u0417\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u0435 \u0432\u0435\u0440\u0438\u0444\u0438\u043a\u0430\u0446\u0438\u044e email.");
    navigate(platformAuthPath("verify"), { replace: true, state: { next: nextPath } });
  };

  const handleVerifySubmit = async () => {
    const pendingEmail = email.trim() || getPlatformPendingEmail();
    if (!pendingEmail || !verificationCode.trim()) {
      setError("\u0412\u0432\u0435\u0434\u0438\u0442\u0435 email \u0438 \u043a\u043e\u0434 \u043f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d\u0438\u044f.");
      return;
    }

    await api.confirm(pendingEmail, verificationCode.trim(), getPlatformPendingChallenge() ?? undefined);
    clearPlatformPendingChallenge();
    clearPlatformPendingEmail();
    await refreshSession();
    navigate(nextPath, { replace: true });
  };

  const handleForgotPasswordSubmit = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError("\u0412\u0432\u0435\u0434\u0438\u0442\u0435 email.");
      return;
    }
    const response = await api.forgotPassword(normalizedEmail);
    setNotice(response.message);
  };

  const handleResetPasswordSubmit = async () => {
    if (!resetToken.trim() || !password || !confirmPassword) {
      setError("\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0442\u043e\u043a\u0435\u043d \u0441\u0431\u0440\u043e\u0441\u0430 \u0438 \u043d\u043e\u0432\u044b\u0439 \u043f\u0430\u0440\u043e\u043b\u044c.");
      return;
    }
    if (password !== confirmPassword) {
      setError("\u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d\u0438\u0435 \u043f\u0430\u0440\u043e\u043b\u044f \u043d\u0435 \u0441\u043e\u0432\u043f\u0430\u0434\u0430\u0435\u0442.");
      return;
    }
    const issues = validatePlatformPassword(password);
    if (issues.length) {
      setError(issues[0] ?? "\u041f\u0430\u0440\u043e\u043b\u044c \u043d\u0435 \u0441\u043e\u043e\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0443\u0435\u0442 \u043f\u043e\u043b\u0438\u0442\u0438\u043a\u0435.");
      return;
    }

    const response = await api.resetPassword(resetToken.trim(), password);
    setNotice(response.message);
    navigate(platformAuthPath("login"), { replace: true });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
            ? "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0441\u043e\u0437\u0434\u0430\u0442\u044c \u0430\u043a\u043a\u0430\u0443\u043d\u0442."
            : mode === "verify"
              ? "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043f\u043e\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044c \u0430\u043a\u043a\u0430\u0443\u043d\u0442."
              : mode === "forgot-password"
                ? "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c \u043f\u0438\u0441\u044c\u043c\u043e \u0434\u043b\u044f \u0441\u0431\u0440\u043e\u0441\u0430."
                : mode === "reset-password"
                  ? "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0441\u0431\u0440\u043e\u0441\u0438\u0442\u044c \u043f\u0430\u0440\u043e\u043b\u044c."
                  : "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0432\u044b\u043f\u043e\u043b\u043d\u0438\u0442\u044c \u0432\u0445\u043e\u0434.",
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
          {(mode === "login" || mode === "register" || mode === "verify" || mode === "forgot-password") && (
            <label className="platform-field">
              <span>Email</span>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" />
            </label>
          )}

          {(mode === "login" || mode === "register" || mode === "reset-password") && (
            <label className="platform-field">
              <span>{mode === "reset-password" ? "\u041d\u043e\u0432\u044b\u0439 \u043f\u0430\u0440\u043e\u043b\u044c" : "\u041f\u0430\u0440\u043e\u043b\u044c"}</span>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={"\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043f\u0430\u0440\u043e\u043b\u044c"} />
            </label>
          )}

          {(mode === "register" || mode === "reset-password") && (
            <label className="platform-field">
              <span>{"\u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0435 \u043f\u0430\u0440\u043e\u043b\u044c"}</span>
              <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder={"\u041f\u043e\u0432\u0442\u043e\u0440\u0438\u0442\u0435 \u043f\u0430\u0440\u043e\u043b\u044c"} />
            </label>
          )}

          {mode === "verify" && (
            <label className="platform-field">
              <span>{"\u041a\u043e\u0434 \u043f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d\u0438\u044f"}</span>
              <input type="text" value={verificationCode} onChange={(event) => setVerificationCode(event.target.value)} placeholder="123456" />
            </label>
          )}

          {mode === "reset-password" && (
            <label className="platform-field">
              <span>{"\u0422\u043e\u043a\u0435\u043d \u0441\u0431\u0440\u043e\u0441\u0430"}</span>
              <input type="text" value={resetToken} onChange={(event) => setResetToken(event.target.value)} placeholder={"\u0412\u0441\u0442\u0430\u0432\u044c\u0442\u0435 \u0442\u043e\u043a\u0435\u043d \u0438\u0437 \u043f\u0438\u0441\u044c\u043c\u0430"} />
            </label>
          )}

          {mode === "register" && (
            <label className="platform-auth-form__checkbox">
              <input type="checkbox" checked={acceptTerms} onChange={(event) => setAcceptTerms(event.target.checked)} />
              <span>{"\u042f \u043f\u0440\u0438\u043d\u0438\u043c\u0430\u044e \u0443\u0441\u043b\u043e\u0432\u0438\u044f \u0438 \u043f\u043e\u043b\u0438\u0442\u0438\u043a\u0443 \u043a\u043e\u043d\u0444\u0438\u0434\u0435\u043d\u0446\u0438\u0430\u043b\u044c\u043d\u043e\u0441\u0442\u0438."}</span>
            </label>
          )}

          {notice ? <p className="platform-feedback platform-feedback--notice">{notice}</p> : null}
          {error ? <p className="platform-feedback platform-feedback--error">{error}</p> : null}

          {mode === "register" && (
            <div className="platform-auth-form__hint">
              {"\u0422\u0440\u0435\u0431\u043e\u0432\u0430\u043d\u0438\u044f \u043a \u043f\u0430\u0440\u043e\u043b\u044e:"}
              <ul className="platform-list">
                {validatePlatformPassword(password || "short").map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          <button type="submit" className="platform-button platform-button--primary" disabled={isSubmitting}>
            {isSubmitting
              ? "\u041f\u043e\u0434\u043e\u0436\u0434\u0438\u0442\u0435..."
              : mode === "login"
                ? "\u0412\u043e\u0439\u0442\u0438"
                : mode === "register"
                  ? "\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u0430\u043a\u043a\u0430\u0443\u043d\u0442"
                  : mode === "verify"
                    ? "\u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044c"
                    : mode === "forgot-password"
                      ? "\u041e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c \u0441\u0441\u044b\u043b\u043a\u0443"
                      : "\u041e\u0431\u043d\u043e\u0432\u0438\u0442\u044c \u043f\u0430\u0440\u043e\u043b\u044c"}
          </button>
        </form>

        <div className="platform-auth-card__links">
          {mode !== "login" ? <Link to={platformAuthPath("login")}>{"\u0412\u043e\u0439\u0442\u0438"}</Link> : null}
          {mode !== "register" ? <Link to={platformAuthPath("register")}>{"\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u0430\u043a\u043a\u0430\u0443\u043d\u0442"}</Link> : null}
          {mode !== "forgot-password" ? <Link to={platformAuthPath("forgot-password")}>{"\u0417\u0430\u0431\u044b\u043b\u0438 \u043f\u0430\u0440\u043e\u043b\u044c?"}</Link> : null}
        </div>
      </div>
    </PlatformAuthLayout>
  );
}
