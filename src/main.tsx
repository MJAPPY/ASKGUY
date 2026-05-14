import { createRoot } from "react-dom/client";
import { Buffer } from "buffer";
import App from "./App";
import "./globals.css";

// Polyfills for crypto/blockchain libraries
window.Buffer = Buffer;
window.global = window;
if (typeof window.process === 'undefined') {
  (window as any).process = { env: {} };
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}