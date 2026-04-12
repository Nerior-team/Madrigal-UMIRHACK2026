import type { AccountProfileDetails, TotpSetupStart } from "../../core/account";

type ProfileSecuritySectionProps = {
  profile: AccountProfileDetails;
  passwordForm: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  passwordIssues: string[];
  isPasswordSubmitting: boolean;
  passwordNotice?: string | null;
  passwordError?: string | null;
  onPasswordFieldChange: (
    field: "currentPassword" | "newPassword" | "confirmPassword",
    value: string,
  ) => void;
  onPasswordSubmit: () => void;
  totpSetup?: TotpSetupStart | null;
  totpCode: string;
  isTotpLoading: boolean;
  totpNotice?: string | null;
  totpError?: string | null;
  onTotpCodeChange: (value: string) => void;
  onTotpStart: () => void;
  onTotpConfirm: () => void;
  onTotpDisable: () => void;
  telegramSetupState?: {
    linkUrl?: string | null;
    reason?: string | null;
  } | null;
  isTelegramLoading: boolean;
  telegramNotice?: string | null;
  telegramError?: string | null;
  onTelegramLink: () => void;
  onTelegramEnable: () => void;
  onTelegramDisable: () => void;
  onTelegramUnlink: () => void;
};

export function ProfileSecuritySection({
  profile,
  passwordForm,
  passwordIssues,
  isPasswordSubmitting,
  passwordNotice,
  passwordError,
  onPasswordFieldChange,
  onPasswordSubmit,
  totpSetup,
  totpCode,
  isTotpLoading,
  totpNotice,
  totpError,
  onTotpCodeChange,
  onTotpStart,
  onTotpConfirm,
  onTotpDisable,
  telegramSetupState,
  isTelegramLoading,
  telegramNotice,
  telegramError,
  onTelegramLink,
  onTelegramEnable,
  onTelegramDisable,
  onTelegramUnlink,
}: ProfileSecuritySectionProps) {
  const totpEnabled = profile.enabledTwoFactorMethods.includes("totp");
  const telegramEnabled = profile.telegram.twoFactorEnabled;

  return (
    <section className="profile-card profile-card--security">
      <header className="profile-card__header">
        <h3>Безопасность</h3>
        <p>Пароль, TOTP, Telegram 2FA и управление привязкой Telegram.</p>
      </header>

      <div className="profile-security-grid">
        <article className="profile-security-panel">
          <div className="profile-security-panel__header">
            <strong>Сменить пароль</strong>
            <span>Минимум 12 символов, цифра, разный регистр и спецсимвол.</span>
          </div>

          <div className="profile-fields">
            <label className="profile-field">
              <span>Текущий пароль</span>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) => onPasswordFieldChange("currentPassword", event.target.value)}
                placeholder="Текущий пароль"
              />
            </label>

            <label className="profile-field">
              <span>Новый пароль</span>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) => onPasswordFieldChange("newPassword", event.target.value)}
                placeholder="Новый пароль"
              />
            </label>

            <label className="profile-field">
              <span>Подтвердите новый пароль</span>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) => onPasswordFieldChange("confirmPassword", event.target.value)}
                placeholder="Повторите новый пароль"
              />
            </label>
          </div>

          {passwordIssues.length ? (
            <ul className="profile-validation-list">
              {passwordIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          ) : null}
          {passwordNotice ? <p className="profile-card__notice">{passwordNotice}</p> : null}
          {passwordError ? <p className="profile-card__error">{passwordError}</p> : null}

          <div className="profile-card__actions">
            <button
              type="button"
              className="profile-action-button"
              onClick={onPasswordSubmit}
              disabled={isPasswordSubmitting}
            >
              {isPasswordSubmitting ? "Сохраняем..." : "Изменить пароль"}
            </button>
          </div>
        </article>

        <article className="profile-security-panel">
          <div className="profile-security-panel__header">
            <strong>TOTP</strong>
            <span>
              {totpEnabled
                ? "Второй фактор включён."
                : "Google Authenticator, 1Password и аналогичные приложения."}
            </span>
          </div>

          {totpSetup ? (
            <div className="profile-two-factor-setup">
              <label className="profile-field">
                <span>Секрет</span>
                <textarea value={totpSetup.secret} readOnly rows={2} />
              </label>
              <label className="profile-field">
                <span>Provisioning URI</span>
                <textarea value={totpSetup.provisioningUri} readOnly rows={3} />
              </label>
              <label className="profile-field">
                <span>Код подтверждения</span>
                <input
                  type="text"
                  value={totpCode}
                  onChange={(event) => onTotpCodeChange(event.target.value)}
                  placeholder="6 цифр"
                />
              </label>
            </div>
          ) : null}

          {totpNotice ? <p className="profile-card__notice">{totpNotice}</p> : null}
          {totpError ? <p className="profile-card__error">{totpError}</p> : null}

          <div className="profile-card__actions">
            {totpEnabled ? (
              <button
                type="button"
                className="profile-action-button profile-action-button--danger"
                onClick={onTotpDisable}
                disabled={isTotpLoading}
              >
                {isTotpLoading ? "Отключаем..." : "Отключить TOTP"}
              </button>
            ) : totpSetup ? (
              <button
                type="button"
                className="profile-action-button"
                onClick={onTotpConfirm}
                disabled={isTotpLoading}
              >
                {isTotpLoading ? "Подключаем..." : "Подтвердить TOTP"}
              </button>
            ) : (
              <button
                type="button"
                className="profile-action-button"
                onClick={onTotpStart}
                disabled={isTotpLoading}
              >
                {isTotpLoading ? "Готовим..." : "Подключить TOTP"}
              </button>
            )}
          </div>
        </article>

        <article className="profile-security-panel">
          <div className="profile-security-panel__header">
            <strong>Telegram</strong>
            <span>
              {profile.telegram.linked
                ? `Привязан к @${profile.telegram.username || profile.telegram.botUsername}`
                : `Сначала привяжите Telegram через @${profile.telegram.botUsername}`}
            </span>
          </div>

          {telegramSetupState?.reason ? (
            <p className="profile-card__notice">{telegramSetupState.reason}</p>
          ) : null}
          {telegramSetupState?.linkUrl ? (
            <a
              className="profile-security-link"
              href={telegramSetupState.linkUrl}
              target="_blank"
              rel="noreferrer"
            >
              Открыть Telegram для привязки
            </a>
          ) : null}
          {telegramNotice ? <p className="profile-card__notice">{telegramNotice}</p> : null}
          {telegramError ? <p className="profile-card__error">{telegramError}</p> : null}

          <div className="profile-card__actions profile-card__actions--stack">
            {!profile.telegram.linked ? (
              <button
                type="button"
                className="profile-action-button"
                onClick={onTelegramLink}
                disabled={isTelegramLoading}
              >
                {isTelegramLoading ? "Готовим..." : "Привязать Telegram"}
              </button>
            ) : null}

            {profile.telegram.linked && !telegramEnabled ? (
              <button
                type="button"
                className="profile-action-button"
                onClick={onTelegramEnable}
                disabled={isTelegramLoading}
              >
                {isTelegramLoading ? "Подключаем..." : "Включить Telegram 2FA"}
              </button>
            ) : null}

            {telegramEnabled ? (
              <button
                type="button"
                className="profile-action-button profile-action-button--danger"
                onClick={onTelegramDisable}
                disabled={isTelegramLoading}
              >
                {isTelegramLoading ? "Отключаем..." : "Отключить Telegram 2FA"}
              </button>
            ) : null}

            {profile.telegram.linked ? (
              <button
                type="button"
                className="profile-action-button profile-action-button--secondary"
                onClick={onTelegramUnlink}
                disabled={isTelegramLoading}
              >
                {isTelegramLoading ? "Отвязываем..." : "Отвязать Telegram"}
              </button>
            ) : null}
          </div>
        </article>
      </div>
    </section>
  );
}
