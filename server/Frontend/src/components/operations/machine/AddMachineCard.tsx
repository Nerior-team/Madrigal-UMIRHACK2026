import type { FormEvent } from "react";

export type AddMachineCardProps = {
  command: string;
  deviceCode: string;
  displayName: string;
  errorMessage?: string | null;
  isSubmitting?: boolean;
  onDeviceCodeChange: (value: string) => void;
  onDisplayNameChange: (value: string) => void;
  onReset: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCopyCommand: () => void;
};

export function AddMachineCard({
  command,
  deviceCode,
  displayName,
  errorMessage = null,
  isSubmitting = false,
  onDeviceCodeChange,
  onDisplayNameChange,
  onReset,
  onSubmit,
  onCopyCommand,
}: AddMachineCardProps) {
  return (
    <section className="machine-pairing-card" aria-label="Добавление машины">
      <div className="machine-pairing-card__copy">
        <h2>Добавление машины</h2>
        <p>
          Подключение идёт через реальный daemon pairing flow. Команда ниже одинаково подходит
          для Windows и Linux-агента.
        </p>

        <ol className="machine-pairing-card__steps">
          <li>Выполните команду на целевой машине.</li>
          <li>Получите device code в терминале.</li>
          <li>Подтвердите этот код здесь и перейдите к новой машине.</li>
        </ol>

        <div className="machine-pairing-card__terminal">
          <div className="machine-pairing-card__terminal-head">
            <span>Pairing command</span>
            <button
              type="button"
              className="machine-pairing-card__terminal-copy"
              onClick={onCopyCommand}
            >
              Скопировать
            </button>
          </div>
          <code>{command}</code>
        </div>
      </div>

      <form className="machine-pairing-card__form" onSubmit={onSubmit}>
        <label className="machine-pairing-card__field">
          <span>Код подтверждения устройства</span>
          <input
            type="text"
            value={deviceCode}
            onChange={(event) => onDeviceCodeChange(event.target.value)}
            placeholder="Например, 761861"
            autoComplete="one-time-code"
            inputMode="numeric"
            aria-label="Код подтверждения устройства"
          />
        </label>

        <label className="machine-pairing-card__field">
          <span>Имя машины</span>
          <input
            type="text"
            value={displayName}
            onChange={(event) => onDisplayNameChange(event.target.value)}
            placeholder="Необязательно"
            aria-label="Имя машины"
          />
        </label>

        {errorMessage ? (
          <p className="machine-pairing-card__feedback" role="alert">
            {errorMessage}
          </p>
        ) : (
          <p className="machine-pairing-card__hint">
            После подтверждения откроется карточка новой машины.
          </p>
        )}

        <div className="machine-pairing-card__actions">
          <button
            type="button"
            className="machine-pairing-card__secondary"
            onClick={onReset}
            disabled={isSubmitting}
          >
            Сбросить
          </button>
          <button
            type="submit"
            className="machine-pairing-card__primary"
            disabled={isSubmitting || !deviceCode.trim()}
          >
            {isSubmitting ? "Подтверждаем..." : "Подтвердить"}
          </button>
        </div>
      </form>
    </section>
  );
}
