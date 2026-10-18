import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/globals.css";
import { App } from "./app/App";
import { gramophone } from "./experience/audio/gramophoneAudio";

// The music starts as the page loads (on the first click, key or tap where
// the browser blocks sound until then).
gramophone.autoplay();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
