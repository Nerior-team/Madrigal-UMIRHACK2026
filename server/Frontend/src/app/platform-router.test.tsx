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
  it("renders platform content on known portal routes", () => {
    render(
      <MemoryRouter initialEntries={["/docs"]}>
        <PlatformRouter renderApp={renderPlatformStub} />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("platform-content")).toBeInTheDocument();
  });

  it("redirects unknown routes to overview", () => {
    render(
      <MemoryRouter initialEntries={["/definitely-unknown"]}>
        <PlatformRouter renderApp={renderPlatformStub} />
        <LocationProbe />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("location-probe")).toHaveTextContent("/");
    expect(screen.getByTestId("platform-content")).toBeInTheDocument();
  });
});
