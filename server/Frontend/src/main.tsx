import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { RootRouter } from "./app/root-router";
import "./styles.css";
import "./platform/platform.css";
import "./public/public.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <RootRouter />
    </BrowserRouter>
  </React.StrictMode>,
);
