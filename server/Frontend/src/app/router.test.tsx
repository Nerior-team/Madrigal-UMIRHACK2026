import { render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AppRouter } from "./router";

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location-probe">{location.pathname}</div>;
}

function renderAppStub() {
  return <div data-testid="app-content">content</div>;
}

describe("AppRouter", () => {
  it("renders auth routes inside auth layout", () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AppRouter renderApp={renderAppStub} />
        <LocationProbe />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("auth-layout")).toBeInTheDocument();
    expect(screen.queryByTestId("app-shell")).not.toBeInTheDocument();
    expect(screen.getByTestId("location-probe")).toHaveTextContent("/login");
  });

  it("renders workspace routes inside app shell", () => {
    render(
      <MemoryRouter initialEntries={["/machines"]}>
        <AppRouter renderApp={renderAppStub} />
        <LocationProbe />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("app-shell")).toBeInTheDocument();
    expect(screen.queryByTestId("auth-layout")).not.toBeInTheDocument();
    expect(screen.getByTestId("location-probe")).toHaveTextContent("/machines");
  });

  it("redirects unknown routes to machines", () => {
    render(
      <MemoryRouter initialEntries={["/definitely-unknown"]}>
        <AppRouter renderApp={renderAppStub} />
        <LocationProbe />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("location-probe")).toHaveTextContent("/machines");
    expect(screen.getByTestId("app-shell")).toBeInTheDocument();
  });
});
