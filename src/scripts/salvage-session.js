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
const durationHoursEl = document.querySelector("#work-order-hours");
const durationMinutesEl = document.querySelector("#work-order-minutes");
const sessionSplashEl = document.querySelector("#session-splash");
const launchSessionBtnEl = document.querySelector("#launch-session-btn");
const activitySelectEl = document.querySelector("#activity-select");
const sessionIdEl = document.querySelector("#session-id");
const sessionClockEl = document.querySelector("#session-clock");
let elapsedSeconds = 0;

const ITEM_HEIGHT = 36;

function initWheelPicker(wheelEl, hiddenInputEl, min, max, initialValue, pad = false) {
  if (!wheelEl || !hiddenInputEl) return null;

  wheelEl.innerHTML = "";
  for (let i = min; i <= max; i++) {
    const item = document.createElement("div");
    item.className = "wheel-item";
    item.dataset.value = String(i);
    item.textContent = pad ? String(i).padStart(2, "0") : String(i);
    item.setAttribute("role", "option");
    wheelEl.appendChild(item);
  }

  const items = Array.from(wheelEl.querySelectorAll(".wheel-item"));

  function updateSelection(val) {
    val = Math.max(min, Math.min(max, val));
    hiddenInputEl.value = String(val);
    items.forEach((item) => {
      const isSelected = Number(item.dataset.value) === val;
      item.classList.toggle("selected", isSelected);
      item.setAttribute("aria-selected", isSelected ? "true" : "false");
    });
  }

  function scrollToValue(val, smooth = true) {
    const clamped = Math.max(min, Math.min(max, val));
    const targetScroll = (clamped - min) * ITEM_HEIGHT;
    if (smooth) {
      wheelEl.scrollTo({ top: targetScroll, behavior: "smooth" });
    } else {
      wheelEl.scrollTop = targetScroll;
    }
    updateSelection(clamped);
  }

  let scrollTimeout = null;
  wheelEl.addEventListener("scroll", () => {
    const rawIndex = Math.round(wheelEl.scrollTop / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(items.length - 1, rawIndex));
    const currentVal = min + clampedIndex;
    updateSelection(currentVal);

    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      scrollToValue(currentVal, true);
    }, 150);
  }, { passive: true });

  wheelEl.addEventListener("click", (event) => {
    const clickedItem = event.target.closest(".wheel-item");
    if (clickedItem) {
      const val = Number(clickedItem.dataset.value);
      scrollToValue(val, true);
    }
  });

  wheelEl.addEventListener("keydown", (event) => {
    const currentVal = Number(hiddenInputEl.value) || min;
    if (event.key === "ArrowUp") {
      event.preventDefault();
      scrollToValue(Math.max(min, currentVal - 1), true);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      scrollToValue(Math.min(max, currentVal + 1), true);
    }
  });

  requestAnimationFrame(() => {
    scrollToValue(initialValue, false);
  });

  return {
    setValue: (val, smooth = false) => scrollToValue(val, smooth)
  };
}

const hoursWheelEl = document.querySelector("#hours-wheel");
const minutesWheelEl = document.querySelector("#minutes-wheel");

const hoursPicker = initWheelPicker(hoursWheelEl, durationHoursEl, 0, 24, 0, false);
const minutesPicker = initWheelPicker(minutesWheelEl, durationMinutesEl, 0, 59, 45, true);

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
  const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${hours}:${(Number(minutes) % 60).toString().padStart(2, "0")}:${seconds}`;
}

function startWorkOrderCountdown(durationSeconds, countdownEl) {
  let remainingSeconds = Math.max(0, Math.round(Number(durationSeconds)));
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
      requestAnimationFrame(() => {
        hoursPicker?.setValue(Number(durationHoursEl.value) || 0, false);
        minutesPicker?.setValue(Number(durationMinutesEl.value) || 45, false);
      });
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
    const durationHours = Number(formData.get("durationHours") || 0);
    const durationMinutes = Number(formData.get("durationMinutes") || 0);
    const durationSeconds = (durationHours * 60 * 60) + (durationMinutes * 60);

    if (durationSeconds <= 0) {
      return;
    }

    const order = {
      location: String(formData.get("processingLocation") || ""),
      type: String(formData.get("type") || ""),
      durationHours,
      durationMinutes,
      durationSeconds,
      cost: String(formData.get("cost") || "")
    };
    const orderEntry = document.createElement("div");
    const orderTitle = document.createElement("strong");
    const orderDetails = document.createElement("span");
    const countdown = document.createElement("span");
    orderEntry.className = "work-order-entry";
    orderTitle.textContent = order.type;
    const durationLabel = [
      order.durationHours ? `${order.durationHours}h` : "",
      order.durationMinutes ? `${order.durationMinutes}m` : ""
    ].filter(Boolean).join(" ");
    orderDetails.textContent = `${order.location} | ${durationLabel} | ${Number(order.cost).toLocaleString("en-US")} aUEC`;
    countdown.className = "work-order-countdown";
    orderEntry.append(orderTitle, orderDetails, countdown);
    workOrderSummaryEl.append(orderEntry);
    startWorkOrderCountdown(order.durationSeconds, countdown);
    workOrderFormEl.reset();
    hoursPicker?.setValue(0, false);
    minutesPicker?.setValue(45, false);
    workOrderSplashEl.hidden = true;
  });
}
