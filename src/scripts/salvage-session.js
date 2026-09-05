import {
  applyTheme,
  applyVisualSettings,
  clearCustomVisualSettings,
  getSavedCustomThemeActive,
  getSavedThemeId,
  getSavedVisualSettings
} from "./modules/themes.js";

const historyBtnEl = document.querySelector("#session-history-btn");
const beginSalvageBtnEl = document.querySelector("#begin-salvage-btn");
const sessionClockEl = document.querySelector("#session-clock");
let elapsedSeconds = 0;

const resolvedTheme = getSavedThemeId("rsi");
applyTheme(resolvedTheme);

if (getSavedCustomThemeActive()) {
  applyVisualSettings(getSavedVisualSettings());
}
else {
  clearCustomVisualSettings();
}

function formatElapsedTime(seconds) {
  const hours = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${remainingSeconds}`;
}

setInterval(() => {
  elapsedSeconds += 1;
  if (sessionClockEl) {
    sessionClockEl.textContent = formatElapsedTime(elapsedSeconds);
  }
}, 1000);

if (historyBtnEl) {
  historyBtnEl.addEventListener("click", () => {
    window.location.href = "sessions.html";
  });
}

if (beginSalvageBtnEl) {
  beginSalvageBtnEl.addEventListener("click", () => {
    beginSalvageBtnEl.textContent = "Salvage In Progress";
    beginSalvageBtnEl.disabled = true;
  });
}
