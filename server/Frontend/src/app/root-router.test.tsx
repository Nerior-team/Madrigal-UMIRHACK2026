import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { RootRouter } from "./root-router";

function renderMainStub() {
  return <div data-testid="main-app-stub">main</div>;
}

function renderPlatformStub() {
  return <div data-testid="platform-app-stub">platform</div>;
}

describe("RootRouter", () => {
  it("renders the main product router for the primary host", () => {
    render(
      <MemoryRouter initialEntries={["/machines"]}>
        <RootRouter
          hostname="nerior.store"
          renderMainApp={renderMainStub}
          renderPlatformApp={renderPlatformStub}
        />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("main-app-stub")).toBeInTheDocument();
    expect(screen.queryByTestId("platform-app-stub")).not.toBeInTheDocument();
  });

  it("renders the platform router for the platform host", () => {
    render(
      <MemoryRouter initialEntries={["/docs"]}>
        <RootRouter
          hostname="platform.nerior.store"
          renderMainApp={renderMainStub}
          renderPlatformApp={renderPlatformStub}
        />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("platform-app-stub")).toBeInTheDocument();
    expect(screen.queryByTestId("main-app-stub")).not.toBeInTheDocument();
  });
});
