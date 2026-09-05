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
const workOrderSplashEl = document.querySelector("#work-order-splash");
const workOrderFormEl = document.querySelector("#work-order-form");
const cancelWorkOrderBtnEl = document.querySelector("#cancel-work-order-btn");
const workOrderSummaryEl = document.querySelector("#work-order-summary");
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

function formatCountdown(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function startWorkOrderCountdown(durationMinutes, countdownEl) {
  let remainingSeconds = Math.max(0, Math.round(Number(durationMinutes) * 60));
  countdownEl.textContent = `Time remaining: ${formatCountdown(remainingSeconds)}`;

  const countdownInterval = setInterval(() => {
    remainingSeconds -= 1;
    countdownEl.textContent = remainingSeconds > 0
      ? `Time remaining: ${formatCountdown(remainingSeconds)}`
      : "Time remaining: 00:00 - Complete";

    if (remainingSeconds <= 0) {
      clearInterval(countdownInterval);
    }
  }, 1000);
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
    if (workOrderSplashEl) {
      workOrderSplashEl.hidden = false;
    }
  });
}

if (cancelWorkOrderBtnEl && workOrderSplashEl) {
  cancelWorkOrderBtnEl.addEventListener("click", () => {
    workOrderSplashEl.hidden = true;
  });
}

if (workOrderFormEl && workOrderSplashEl && workOrderSummaryEl) {
  workOrderFormEl.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(workOrderFormEl);
    const order = {
      location: String(formData.get("processingLocation") || ""),
      type: String(formData.get("type") || ""),
      duration: String(formData.get("duration") || ""),
      cost: String(formData.get("cost") || "")
    };
    const orderEntry = document.createElement("div");
    const orderTitle = document.createElement("strong");
    const orderDetails = document.createElement("span");
    const countdown = document.createElement("span");
    orderEntry.className = "work-order-entry";
    orderTitle.textContent = order.type;
    orderDetails.textContent = `${order.location} | ${order.duration} min | ${Number(order.cost).toLocaleString("en-US")} aUEC`;
    countdown.className = "work-order-countdown";
    orderEntry.append(orderTitle, orderDetails, countdown);
    workOrderSummaryEl.append(orderEntry);
    startWorkOrderCountdown(order.duration, countdown);
    workOrderFormEl.reset();
    workOrderSplashEl.hidden = true;
  });
}
