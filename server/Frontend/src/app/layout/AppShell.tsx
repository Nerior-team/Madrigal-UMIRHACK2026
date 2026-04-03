import { Outlet } from "react-router-dom";

export function AppShell() {
  return (
    <div>
      <aside>Madrigal</aside>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
