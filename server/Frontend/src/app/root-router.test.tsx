import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { RootRouter } from "./root-router";

function renderCrossplatStub() {
  return <div data-testid="crossplat-app-stub">crossplat</div>;
}

function renderApiStub() {
  return <div data-testid="api-app-stub">api</div>;
}

describe("RootRouter", () => {
  it("renders the crossplat product router for the crossplat host", () => {
    render(
      <MemoryRouter initialEntries={["/machines"]}>
        <RootRouter
          hostname="crossplat.nerior.store"
          renderCrossplatApp={renderCrossplatStub}
          renderApiApp={renderApiStub}
        />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("crossplat-app-stub")).toBeInTheDocument();
    expect(screen.queryByTestId("api-app-stub")).not.toBeInTheDocument();
  });

  it("renders the api router for the api host", () => {
    render(
      <MemoryRouter initialEntries={["/docs"]}>
        <RootRouter
          hostname="api.nerior.store"
          renderCrossplatApp={renderCrossplatStub}
          renderApiApp={renderApiStub}
          initialApiSessionStatus="authenticated"
          disableApiSessionBootstrap
        />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("api-app-stub")).toBeInTheDocument();
    expect(screen.queryByTestId("crossplat-app-stub")).not.toBeInTheDocument();
  });

  it("renders the public placeholder for the company site host", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <RootRouter hostname="nerior.store" />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /системы, продукты/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Обновления" })).toBeInTheDocument();
  });
});
