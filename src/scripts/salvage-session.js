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
const sessionSplashEl = document.querySelector("#session-splash");
const launchSessionBtnEl = document.querySelector("#launch-session-btn");
const activitySelectEl = document.querySelector("#activity-select");
const sessionIdEl = document.querySelector("#session-id");
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

function generateSessionId() {
  return Math.floor(1000 + Math.random() * 9000).toString();
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

if (launchSessionBtnEl && sessionSplashEl) {
  launchSessionBtnEl.addEventListener("click", () => {
    const activity = activitySelectEl?.value || "salvage";
    const sessionId = generateSessionId();
    sessionSplashEl.hidden = true;
    document.body.dataset.activity = activity;
    document.body.dataset.sessionId = sessionId;

    if (sessionIdEl) {
      sessionIdEl.textContent = `ID ${sessionId}`;
    }
  });
}

if (beginSalvageBtnEl) {
  beginSalvageBtnEl.addEventListener("click", () => {
    beginSalvageBtnEl.textContent = "Salvage In Progress";
    beginSalvageBtnEl.disabled = true;
  });
}
