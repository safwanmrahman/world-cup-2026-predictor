import html2canvas from "html2canvas";

export async function exportBracketImage(element, filename = "world-cup-2026-my-prediction.png") {
  if (!element) {
    return;
  }

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
