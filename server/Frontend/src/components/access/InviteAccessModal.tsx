import { ModalFrame } from "../primitives/ModalFrame";
import { CustomSelect, type CustomSelectOption } from "../primitives/CustomSelect";
import type { AccessDashboardResponse } from "../../core";

type RoleValue = AccessDashboardResponse["machines"][number]["availableRoleValues"][number];

type InviteAccessModalProps = {
  machineOptions: Array<CustomSelectOption<string>>;
  roleOptions: Array<CustomSelectOption<RoleValue>>;
  selectedMachineId: string;
  selectedRole: RoleValue;
  email: string;
  password: string;
  errorMessage?: string | null;
  isSubmitting: boolean;
  onMachineChange: (value: string) => void;
  onRoleChange: (value: RoleValue) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function InviteAccessModal({
  machineOptions,
  roleOptions,
  selectedMachineId,
  selectedRole,
  email,
  password,
  errorMessage,
  isSubmitting,
  onMachineChange,
  onRoleChange,
  onEmailChange,
  onPasswordChange,
  onClose,
  onSubmit,
}: InviteAccessModalProps) {
  return (
    <div className="access-modal-backdrop" onClick={onClose}>
      <div
        className="access-modal-card"
        onClick={(event) => event.stopPropagation()}
      >
        <ModalFrame
          title="Новое приглашение"
          subtitle="Доступ отправится на email только после подтверждения паролем."
          actions={
            <button
              type="button"
              className="access-modal__ghost"
              onClick={onClose}
            >
              Закрыть
            </button>
          }
        >
          <form className="access-form" onSubmit={onSubmit}>
            <label className="access-form__field">
              <span>Машина</span>
              <CustomSelect
                value={selectedMachineId}
                options={machineOptions}
                onChange={onMachineChange}
                ariaLabel="Выберите машину для приглашения"
                className="access-form__select"
              />
            </label>

            <label className="access-form__field">
              <span>Роль</span>
              <CustomSelect
                value={selectedRole}
                options={roleOptions}
                onChange={onRoleChange}
                ariaLabel="Выберите роль приглашения"
                className="access-form__select"
              />
            </label>

            <label className="access-form__field">
              <span>Email пользователя</span>
              <input
                type="email"
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                placeholder="user@company.ru"
                autoComplete="email"
              />
            </label>

            <label className="access-form__field">
              <span>Пароль для подтверждения</span>
              <input
                type="password"
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
                placeholder="Текущий пароль"
                autoComplete="current-password"
              />
            </label>

            {errorMessage ? (
              <p className="access-form__error" role="alert">
                {errorMessage}
              </p>
            ) : null}

            <div className="access-form__actions">
              <button
                type="button"
                className="access-modal__ghost"
                onClick={onClose}
              >
                Отмена
              </button>
              <button
                type="submit"
                className="access-modal__primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Отправка..." : "Отправить приглашение"}
              </button>
            </div>
          </form>
        </ModalFrame>
      </div>
    </div>
  );
}
