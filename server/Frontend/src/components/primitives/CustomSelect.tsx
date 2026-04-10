import type { ReactNode } from "react";

export type CustomSelectOption<T extends string = string> = {
  value: T;
  label: string;
  description?: string;
  icon?: ReactNode;
};

type CustomSelectProps<T extends string = string> = {
  value: T;
  options: Array<CustomSelectOption<T>>;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
};

export function CustomSelect<T extends string = string>({
  value,
  options,
  onChange,
  ariaLabel,
  className,
}: CustomSelectProps<T>) {
  return (
    <label className={className ? `custom-select ${className}` : "custom-select"}>
      <select
        className="custom-select__control"
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
