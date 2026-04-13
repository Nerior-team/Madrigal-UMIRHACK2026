import type { FormEvent } from "react";
import { useState } from "react";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AddMachineCard, type AddMachineCardProps } from "./AddMachineCard";

function renderHarness(
  overrides: Partial<AddMachineCardProps> = {},
): AddMachineCardProps {
  const props: AddMachineCardProps = {
    command: "predict pair --backend-url https://crossplat.nerior.store",
    deviceCode: "",
    displayName: "",
    errorMessage: null,
    isSubmitting: false,
    onDeviceCodeChange: vi.fn(),
    onDisplayNameChange: vi.fn(),
    onReset: vi.fn(),
    onSubmit: vi.fn((event: FormEvent<HTMLFormElement>) =>
      event.preventDefault(),
    ),
    onCopyCommand: vi.fn(),
    ...overrides,
  };

  function Harness() {
    const [deviceCode, setDeviceCode] = useState(props.deviceCode);
    const [displayName, setDisplayName] = useState(props.displayName);

    return (
      <AddMachineCard
        {...props}
        deviceCode={deviceCode}
        displayName={displayName}
        onDeviceCodeChange={(value) => {
          setDeviceCode(value);
          props.onDeviceCodeChange(value);
        }}
        onDisplayNameChange={(value) => {
          setDisplayName(value);
          props.onDisplayNameChange(value);
        }}
      />
    );
  }

  render(<Harness />);
  return props;
}

describe("AddMachineCard", () => {
  it("renders pairing instructions and the backend command", () => {
    renderHarness();

    expect(
      screen.getByRole("heading", { name: "Добавление машины" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("predict pair --backend-url https://crossplat.nerior.store"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Код подтверждения устройства"),
    ).toBeInTheDocument();
  });

  it("routes copy, reset and submit actions through callbacks", async () => {
    const user = userEvent.setup();
    const props = renderHarness();

    await user.type(
      screen.getByLabelText("Код подтверждения устройства"),
      "761861",
    );
    await user.type(screen.getByLabelText("Имя машины"), "prod-linux");
    await user.click(screen.getByRole("button", { name: "Скопировать" }));
    await user.click(screen.getByRole("button", { name: "Сбросить" }));
    await user.click(screen.getByRole("button", { name: "Подтвердить" }));

    expect(props.onDeviceCodeChange).toHaveBeenCalled();
    expect(props.onDisplayNameChange).toHaveBeenCalled();
    expect(props.onCopyCommand).toHaveBeenCalledTimes(1);
    expect(props.onReset).toHaveBeenCalledTimes(1);
    expect(props.onSubmit).toHaveBeenCalledTimes(1);
  });

  it("shows feedback state while submission is running", () => {
    renderHarness({
      deviceCode: "761861",
      errorMessage: "Не удалось подтвердить code.",
      isSubmitting: true,
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Не удалось подтвердить code.",
    );
    expect(
      screen.getByRole("button", { name: "Подтверждаем..." }),
    ).toBeDisabled();
  });
});
