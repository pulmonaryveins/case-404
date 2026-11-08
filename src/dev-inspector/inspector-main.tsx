import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ModelInspectorApp } from "./ModelInspectorApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ModelInspectorApp />
  </StrictMode>,
);
