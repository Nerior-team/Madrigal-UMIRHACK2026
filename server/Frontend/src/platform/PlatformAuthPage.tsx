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
  if (password.length < 12) issues.push("Use at least 12 characters.");
  if (!/[a-z]/.test(password)) issues.push("Add a lowercase letter.");
  if (!/[A-Z]/.test(password)) issues.push("Add an uppercase letter.");
  if (!/\d/.test(password)) issues.push("Add a number.");
  if (!/[^A-Za-z0-9]/.test(password)) issues.push("Add a symbol.");
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
      ? "Sign in to Nerior API"
      : mode === "register"
        ? "Create an API account"
        : mode === "verify"
          ? "Verify API access"
          : mode === "forgot-password"
            ? "Reset your password"
            : "Set a new password";

  const subtitle =
    mode === "login"
      ? "API access uses its own session and sign-in flow."
      : mode === "register"
        ? "Create access for API keys, product scopes, and usage visibility."
        : mode === "verify"
          ? "Enter the email code or two-factor code to continue."
          : mode === "forgot-password"
            ? "We will send a reset link to your email."
            : "Use the token from your email to set a new password.";

  const handleLoginSubmit = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      setError("Enter your email and password.");
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
      setError("Complete all required fields.");
      return;
    }
    if (!acceptTerms) {
      setError("Accept the terms to continue.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Password confirmation does not match.");
      return;
    }

    const issues = validatePlatformPassword(password);
    if (issues.length) {
      setError(issues[0] ?? "Password does not meet the policy.");
      return;
    }

    await api.register(normalizedEmail, password);
    setPlatformPendingEmail(normalizedEmail);
    setPlatformPendingChallenge(null);
    setNotice("Verification code sent. Complete email verification to continue.");
    navigate(platformAuthPath("verify"), { replace: true, state: { next: nextPath } });
  };

  const handleVerifySubmit = async () => {
    const pendingEmail = email.trim() || getPlatformPendingEmail();
    if (!pendingEmail || !verificationCode.trim()) {
      setError("Enter your email and verification code.");
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
      setError("Enter your email.");
      return;
    }
    const response = await api.forgotPassword(normalizedEmail);
    setNotice(response.message);
  };

  const handleResetPasswordSubmit = async () => {
    if (!resetToken.trim() || !password || !confirmPassword) {
      setError("Enter the reset token and the new password.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Password confirmation does not match.");
      return;
    }
    const issues = validatePlatformPassword(password);
    if (issues.length) {
      setError(issues[0] ?? "Password does not meet the policy.");
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
            ? "Failed to create the account."
            : mode === "verify"
              ? "Failed to verify the account."
              : mode === "forgot-password"
                ? "Failed to send the reset email."
                : mode === "reset-password"
                  ? "Failed to reset the password."
                  : "Failed to sign in.",
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
              <span>{mode === "reset-password" ? "New password" : "Password"}</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
              />
            </label>
          )}

          {mode === "register" || mode === "reset-password" ? (
            <label className="platform-field">
              <span>Confirm password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm password"
              />
            </label>
          ) : null}

          {mode === "verify" ? (
            <label className="platform-field">
              <span>Verification code</span>
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
              <span>Reset token</span>
              <input
                type="text"
                value={resetToken}
                onChange={(event) => setResetToken(event.target.value)}
                placeholder="Paste token from email"
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
              <span>I agree to the Terms and Privacy Policy.</span>
            </label>
          ) : null}

          {notice ? <p className="platform-feedback platform-feedback--notice">{notice}</p> : null}
          {error ? <p className="platform-feedback platform-feedback--error">{error}</p> : null}

          {mode === "register" ? (
            <div className="platform-auth-form__hint">
              Password requirements:
              <ul className="platform-list">
                {validatePlatformPassword(password || "short").map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <button type="submit" className="platform-button platform-button--primary" disabled={isSubmitting}>
            {isSubmitting
              ? "Please wait..."
              : mode === "login"
                ? "Sign in"
                : mode === "register"
                  ? "Create account"
                  : mode === "verify"
                    ? "Verify"
                    : mode === "forgot-password"
                      ? "Send reset link"
                      : "Update password"}
          </button>
        </form>

        <div className="platform-auth-card__links">
          {mode !== "login" ? <Link to={platformAuthPath("login")}>Sign in</Link> : null}
          {mode !== "register" ? <Link to={platformAuthPath("register")}>Create account</Link> : null}
          {mode !== "forgot-password" ? (
            <Link to={platformAuthPath("forgot-password")}>Forgot password?</Link>
          ) : null}
        </div>
      </div>
    </PlatformAuthLayout>
  );
}
