import html2canvas from "html2canvas";

const EXPORT_SAFE_CLASS = "export-safe-capture";
const EXPORT_SAFE_ATTRIBUTE = "data-export-safe-target";

function waitForExportSafeStyles() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(resolve);
    });
  });
}

export async function exportBracketImage(element, filename = "world-cup-2026-my-prediction.png") {
  if (!element) {
    return;
  }

  const exportThemeBackground = getComputedStyle(document.documentElement)
    .getPropertyValue("--bg-primary")
    .trim() || "#0f1117";
  element.classList.add(EXPORT_SAFE_CLASS);
  element.setAttribute(EXPORT_SAFE_ATTRIBUTE, "true");

  try {
    await waitForExportSafeStyles();

    const canvas = await html2canvas(element, {
      backgroundColor: exportThemeBackground,
      scale: 2,
      useCORS: true,
      logging: false,
      onclone: (clonedDocument) => {
        const clonedElement = clonedDocument.querySelector(`[${EXPORT_SAFE_ATTRIBUTE}="true"]`);
        clonedElement?.classList.add(EXPORT_SAFE_CLASS);
      },
    });

    const link = document.createElement("a");
    link.download = filename;
    link.href = canvas.toDataURL("image/png");
    link.click();
  } finally {
    element.classList.remove(EXPORT_SAFE_CLASS);
    element.removeAttribute(EXPORT_SAFE_ATTRIBUTE);
  }
}
