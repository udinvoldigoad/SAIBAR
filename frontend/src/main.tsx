import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { ErrorBoundary } from "./shared/components/ErrorBoundary";
import { installChunkReloadHandler } from "./shared/utils/chunkReload";
import "@fontsource/geist-sans";
import "./shared/styles/tokens.css";

// Chunk halaman gagal diunduh (tab lama setelah deploy / jaringan putus) →
// muat ulang sekali secara otomatis.
installChunkReloadHandler();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.error('SW registration failed: ', err);
    });
  });
}
