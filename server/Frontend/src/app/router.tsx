import { createBrowserRouter } from "react-router-dom";

import { AppShell } from "./layout/AppShell";
import { AccessPage } from "../pages/AccessPage";
import { CommandsPage } from "../pages/CommandsPage";
import { DashboardPage } from "../pages/DashboardPage";
import { LoginPage } from "../pages/LoginPage";
import { LogsPage } from "../pages/LogsPage";
import { MachineDetailsPage } from "../pages/MachineDetailsPage";
import { MachinesPage } from "../pages/MachinesPage";
import { MetricsPage } from "../pages/MetricsPage";
import { ProfilePage } from "../pages/ProfilePage";
import { RegisterPage } from "../pages/RegisterPage";
import { ResultsPage } from "../pages/ResultsPage";
import { TasksPage } from "../pages/TasksPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    path: "/",
    element: <AppShell />,
    children: [
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/machines", element: <MachinesPage /> },
      { path: "/machines/:machineId", element: <MachineDetailsPage /> },
      { path: "/tasks", element: <TasksPage /> },
      { path: "/results", element: <ResultsPage /> },
      { path: "/logs", element: <LogsPage /> },
      { path: "/commands", element: <CommandsPage /> },
      { path: "/access", element: <AccessPage /> },
      { path: "/metrics", element: <MetricsPage /> },
      { path: "/profile", element: <ProfilePage /> }
    ]
  }
]);
