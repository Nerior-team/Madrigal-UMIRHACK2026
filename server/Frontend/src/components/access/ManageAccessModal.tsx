import { ModalFrame } from "../primitives/ModalFrame";
import { CustomSelect, type CustomSelectOption } from "../primitives/CustomSelect";
import type { AccessDashboardResponse } from "../../core";

type AccessUserRow = AccessDashboardResponse["users"][number];
type RoleValue = AccessUserRow["availableRoleValues"][number];

type ManageAccessModalProps = {
  row: AccessUserRow;
  roleOptions: Array<CustomSelectOption<RoleValue>>;
  selectedRole: RoleValue;
  password: string;
  errorMessage?: string | null;
  isSubmitting: boolean;
  onRoleChange: (value: RoleValue) => void;
  onPasswordChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onRevoke: () => void;
};

export function ManageAccessModal({
  row,
  roleOptions,
  selectedRole,
  password,
  errorMessage,
  isSubmitting,
  onRoleChange,
  onPasswordChange,
  onClose,
  onSubmit,
  onRevoke,
}: ManageAccessModalProps) {
  return (
    <div className="access-modal-backdrop" onClick={onClose}>
      <div
        className="access-modal-card"
        onClick={(event) => event.stopPropagation()}
      >
        <ModalFrame
          title="Управление доступом"
          subtitle={`${row.email} • ${row.resource}`}
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
              <span>Роль</span>
              <CustomSelect
                value={selectedRole}
                options={roleOptions}
                onChange={onRoleChange}
                ariaLabel="Изменить роль пользователя"
                className="access-form__select"
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

            <div className="access-form__actions access-form__actions--split">
              <button
                type="button"
                className="access-modal__danger"
                disabled={isSubmitting || !row.canRevoke}
                onClick={onRevoke}
              >
                Отозвать доступ
              </button>

              <div className="access-form__primary-actions">
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
                  {isSubmitting ? "Сохранение..." : "Сохранить роль"}
                </button>
              </div>
            </div>
          </form>
        </ModalFrame>
      </div>
    </div>
  );
}
