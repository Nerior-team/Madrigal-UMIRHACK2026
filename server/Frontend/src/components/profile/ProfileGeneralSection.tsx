import { CustomSelect } from "../primitives/CustomSelect";
import type {
  AccountProfileDetails,
  DeletedMachineRetention,
} from "../../core/account";
import { getRetentionOptions } from "../../core/account-ui";

type ProfileGeneralSectionProps = {
  profile: AccountProfileDetails;
  firstName: string;
  lastName: string;
  avatarDataUrl?: string | null;
  deletedMachineRetention: DeletedMachineRetention;
  isSaving: boolean;
  notice?: string | null;
  error?: string | null;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onRetentionChange: (value: DeletedMachineRetention) => void;
  onAvatarPick: () => void;
  onSubmit: () => void;
};

export function ProfileGeneralSection({
  profile,
  firstName,
  lastName,
  avatarDataUrl,
  deletedMachineRetention,
  isSaving,
  notice,
  error,
  onFirstNameChange,
  onLastNameChange,
  onRetentionChange,
  onAvatarPick,
  onSubmit,
}: ProfileGeneralSectionProps) {
  return (
    <section className="profile-card profile-card--general">
      <header className="profile-card__header">
        <h3>Профиль</h3>
        <p>
          Личные данные, фото профиля и правила хранения удалённых машин.
        </p>
      </header>

      <div className="profile-main-info">
        <span className="profile-avatar" aria-hidden="true">
          {avatarDataUrl ? <img src={avatarDataUrl} alt="" aria-hidden="true" /> : null}
        </span>
        <div className="profile-main-info__controls">
          <button
            type="button"
            className="profile-main-info__add"
            onClick={onAvatarPick}
          >
            {avatarDataUrl ? "Обновить фото" : "Добавить фото"}
          </button>
          <span className="profile-main-info__hint">PNG или JPG, до 1.5 МБ.</span>
        </div>
      </div>

      <div className="profile-fields profile-fields--two">
        <label className="profile-field">
          <span>Имя</span>
          <input
            type="text"
            value={firstName}
            onChange={(event) => onFirstNameChange(event.target.value)}
            placeholder="Имя"
          />
        </label>

        <label className="profile-field">
          <span>Фамилия</span>
          <input
            type="text"
            value={lastName}
            onChange={(event) => onLastNameChange(event.target.value)}
            placeholder="Фамилия"
          />
        </label>
      </div>

      <label className="profile-field">
        <span>Электронная почта</span>
        <input type="email" value={profile.email} readOnly />
      </label>

      <label className="profile-field">
        <span>Удалённые машины</span>
        <CustomSelect
          value={deletedMachineRetention}
          options={getRetentionOptions()}
          onChange={onRetentionChange}
          ariaLabel="Период хранения удалённых машин"
        />
      </label>

      {notice ? <p className="profile-card__notice">{notice}</p> : null}
      {error ? <p className="profile-card__error">{error}</p> : null}

      <div className="profile-card__actions">
        <button
          type="button"
          className="profile-action-button"
          onClick={onSubmit}
          disabled={isSaving}
        >
          {isSaving ? "Сохраняем..." : "Сохранить"}
        </button>
      </div>
    </section>
  );
}
