import { render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { PlatformRouter } from "./platform-router";

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location-probe">{location.pathname}</div>;
}

function renderPlatformStub() {
  return <div data-testid="platform-content">platform content</div>;
}

describe("PlatformRouter", () => {
  it("renders platform content on protected routes for authenticated sessions", () => {
    render(
      <MemoryRouter initialEntries={["/docs"]}>
        <PlatformRouter
          renderApp={renderPlatformStub}
          initialSessionStatus="authenticated"
          disableSessionBootstrap
        />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("platform-content")).toBeInTheDocument();
  });

  it("redirects guests to login on protected routes", () => {
    render(
      <MemoryRouter initialEntries={["/docs"]}>
        <PlatformRouter
          renderApp={renderPlatformStub}
          initialSessionStatus="guest"
          disableSessionBootstrap
        />
        <LocationProbe />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("location-probe")).toHaveTextContent("/login");
    expect(screen.getByTestId("platform-auth-layout")).toBeInTheDocument();
  });
});
