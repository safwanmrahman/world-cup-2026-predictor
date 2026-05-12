import { MANUAL_EXPORT_SCRIPT_ID } from "../data/constants";

export async function loadHtml2Canvas() {
  if (window.html2canvas) {
    return window.html2canvas;
  }

  const existing = document.getElementById(MANUAL_EXPORT_SCRIPT_ID);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(window.html2canvas), { once: true });
      existing.addEventListener("error", reject, { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = MANUAL_EXPORT_SCRIPT_ID;
    script.src = "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
    script.async = true;
    script.onload = () => resolve(window.html2canvas);
    script.onerror = () => reject(new Error("Could not load bracket export helper."));
    document.head.appendChild(script);
  });
}

export async function exportBracketImage(element, filename = "world-cup-2026-my-prediction.png") {
  if (!element) {
    return;
  }

  const html2canvas = await loadHtml2Canvas();
  const exportThemeBackground = getComputedStyle(document.documentElement)
    .getPropertyValue("--bg-primary")
    .trim() || "#0f1117";
  const canvas = await html2canvas(element, {
    backgroundColor: exportThemeBackground,
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
