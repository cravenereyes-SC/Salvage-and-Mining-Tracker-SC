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
const activeWorkOrdersListEl = document.querySelector("#active-work-orders-list");
const completedWorkOrdersListEl = document.querySelector("#completed-work-orders-list");
const activeOrdersCountEl = document.querySelector("#active-orders-count");
const completedOrdersCountEl = document.querySelector("#completed-orders-count");
const activeEmptyMsgEl = document.querySelector("#active-empty-msg");
const completedEmptyMsgEl = document.querySelector("#completed-empty-msg");
const summaryRunningCountEl = document.querySelector("#summary-running-count");
const summaryCompletedCountEl = document.querySelector("#summary-completed-count");
const summaryTotalCostEl = document.querySelector("#summary-total-cost");
const durationHoursEl = document.querySelector("#work-order-hours");
const durationMinutesEl = document.querySelector("#work-order-minutes");
const sessionSplashEl = document.querySelector("#session-splash");
const launchSessionBtnEl = document.querySelector("#launch-session-btn");
const activitySelectEl = document.querySelector("#activity-select");
const sessionIdEl = document.querySelector("#session-id");
const sessionClockEl = document.querySelector("#session-clock");

const addExpenseBtnEl = document.querySelector("#add-expense-btn");
const expenseSplashEl = document.querySelector("#expense-splash");
const expenseFormEl = document.querySelector("#expense-form");
const cancelExpenseBtnEl = document.querySelector("#cancel-expense-btn");
const expenseTypeSelectEl = document.querySelector("#expense-type");
const expenseAmountInputEl = document.querySelector("#expense-amount");
const expenseContractDisplayEl = document.querySelector("#expense-contract-display");
const expenseFuelDisplayEl = document.querySelector("#expense-fuel-display");
const expenseRepairDisplayEl = document.querySelector("#expense-repair-display");
const expenseRefiningDisplayEl = document.querySelector("#expense-refining-display");
const expenseTotalDisplayEl = document.querySelector("#expense-total-display");

const addCrewBtnEl = document.querySelector("#add-crew-btn");
const crewSplashEl = document.querySelector("#crew-splash");
const crewFormEl = document.querySelector("#crew-form");
const cancelCrewBtnEl = document.querySelector("#cancel-crew-btn");
const crewListEl = document.querySelector("#crew-list");
const crewTotalCountEl = document.querySelector("#crew-total-count");

let savedPilotCallsign = "CPT-AURORA";
try {
  const savedProfile = JSON.parse(localStorage.getItem("sc-tracker-pilot-profile"));
  if (savedProfile && savedProfile.callsign) {
    savedPilotCallsign = savedProfile.callsign;
  }
} catch {
  // fallback default
}

let crewMembers = [
  {
    id: "crew-1",
    name: savedPilotCallsign,
    role: "Captain",
    cut: 100,
    isPrimary: true
  }
];

let sessionExpenses = {
  contractCost: 0,
  fuelCost: 0,
  repairCost: 0,
  refiningCost: 0
};

let elapsedSeconds = 0;
let totalRefiningCost = 0;

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

function updateWorkOrderListsState() {
  const activeCount = activeWorkOrdersListEl ? activeWorkOrdersListEl.querySelectorAll(".work-order-entry").length : 0;
  const completedCount = completedWorkOrdersListEl ? completedWorkOrdersListEl.querySelectorAll(".work-order-entry").length : 0;

  if (activeOrdersCountEl) activeOrdersCountEl.textContent = String(activeCount);
  if (completedOrdersCountEl) completedOrdersCountEl.textContent = String(completedCount);
  if (summaryRunningCountEl) summaryRunningCountEl.textContent = String(activeCount);
  if (summaryCompletedCountEl) summaryCompletedCountEl.textContent = String(completedCount);
  if (summaryTotalCostEl) summaryTotalCostEl.textContent = `${totalRefiningCost.toLocaleString("en-US")} aUEC`;

  if (activeEmptyMsgEl) {
    activeEmptyMsgEl.style.display = activeCount === 0 ? "block" : "none";
  }
  if (completedEmptyMsgEl) {
    completedEmptyMsgEl.style.display = completedCount === 0 ? "block" : "none";
  }
}

function completeWorkOrder(orderEntry, countdownEl) {
  orderEntry.classList.remove("running");
  orderEntry.classList.add("completed");
  countdownEl.className = "work-order-status-badge";
  countdownEl.textContent = "✓ Refining Complete";

  if (completedWorkOrdersListEl) {
    completedWorkOrdersListEl.prepend(orderEntry);
  }
  updateWorkOrderListsState();
}

function startWorkOrderCountdown(durationSeconds, countdownEl, orderEntry) {
  let remainingSeconds = Math.max(0, Math.round(Number(durationSeconds)));
  countdownEl.textContent = `Time remaining: ${formatCountdown(remainingSeconds)}`;

  const countdownInterval = setInterval(() => {
    remainingSeconds -= 1;
    if (remainingSeconds > 0) {
      countdownEl.textContent = `Time remaining: ${formatCountdown(remainingSeconds)}`;
    } else {
      clearInterval(countdownInterval);
      completeWorkOrder(orderEntry, countdownEl);
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

function handleStartSession() {
  const activity = activitySelectEl?.value || "salvage";
  const sessionId = generateSessionId();
  sessionSplashEl.hidden = true;
  document.body.dataset.activity = activity;
  document.body.dataset.sessionId = sessionId;

  if (sessionIdEl) {
    sessionIdEl.textContent = `ID ${sessionId}`;
  }
}

if (launchSessionBtnEl && sessionSplashEl) {
  launchSessionBtnEl.addEventListener("click", handleStartSession);
}

if (sessionSplashEl) {
  sessionSplashEl.addEventListener("click", (event) => {
    if (event.target === sessionSplashEl) {
      handleStartSession();
    }
  });
}

function updateExpenseDisplay() {
  const total = (sessionExpenses.contractCost || 0) + (sessionExpenses.fuelCost || 0) + (sessionExpenses.repairCost || 0) + (sessionExpenses.refiningCost || 0);
  if (expenseContractDisplayEl) {
    expenseContractDisplayEl.textContent = `${(sessionExpenses.contractCost || 0).toLocaleString("en-US")} aUEC`;
  }
  if (expenseFuelDisplayEl) {
    expenseFuelDisplayEl.textContent = `${(sessionExpenses.fuelCost || 0).toLocaleString("en-US")} aUEC`;
  }
  if (expenseRepairDisplayEl) {
    expenseRepairDisplayEl.textContent = `${(sessionExpenses.repairCost || 0).toLocaleString("en-US")} aUEC`;
  }
  if (expenseRefiningDisplayEl) {
    expenseRefiningDisplayEl.textContent = `${(sessionExpenses.refiningCost || 0).toLocaleString("en-US")} aUEC`;
  }
  if (expenseTotalDisplayEl) {
    expenseTotalDisplayEl.textContent = `${total.toLocaleString("en-US")} aUEC`;
  }
}

if (addExpenseBtnEl && expenseSplashEl) {
  addExpenseBtnEl.addEventListener("click", () => {
    if (expenseAmountInputEl) {
      expenseAmountInputEl.value = "";
    }
    expenseSplashEl.hidden = false;
  });
}

if (cancelExpenseBtnEl && expenseSplashEl) {
  cancelExpenseBtnEl.addEventListener("click", () => {
    expenseSplashEl.hidden = true;
  });
}

if (expenseSplashEl) {
  expenseSplashEl.addEventListener("click", (event) => {
    if (event.target === expenseSplashEl) {
      expenseSplashEl.hidden = true;
    }
  });
}

if (expenseFormEl && expenseSplashEl) {
  expenseFormEl.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(expenseFormEl);
    const expenseType = formData.get("expenseType");
    const amount = Number(formData.get("amount") || 0);

    if (expenseType === "contract") {
      sessionExpenses.contractCost = (sessionExpenses.contractCost || 0) + amount;
    } else if (expenseType === "fuel") {
      sessionExpenses.fuelCost = (sessionExpenses.fuelCost || 0) + amount;
    } else if (expenseType === "repair") {
      sessionExpenses.repairCost = (sessionExpenses.repairCost || 0) + amount;
    } else if (expenseType === "refining") {
      sessionExpenses.refiningCost = (sessionExpenses.refiningCost || 0) + amount;
    }

    updateExpenseDisplay();
    expenseFormEl.reset();
    expenseSplashEl.hidden = true;
  });
}

const CREW_ROLES = [
  "Captain",
  "Pilot",
  "Co-Pilot",
  "Salvage Operator",
  "Mining Operator",
  "Tractor Operator",
  "Cargo Handler",
  "Gunner",
  "Engineer"
];

function recalculateCaptainCut() {
  const primary = crewMembers.find((c) => c.isPrimary) || crewMembers[0];
  if (!primary) return;
  const otherCuts = crewMembers
    .filter((c) => c !== primary)
    .reduce((sum, c) => sum + (Number(c.cut) || 0), 0);
  primary.cut = Math.max(0, 100 - otherCuts);
}

function updateCaptainInputDisplay() {
  const primary = crewMembers.find((c) => c.isPrimary) || crewMembers[0];
  if (!primary || !crewListEl) return;
  const captInput = crewListEl.querySelector('.crew-cut-input[data-primary="true"]');
  if (captInput) {
    captInput.value = String(primary.cut);
  }
}

function renderCrewList() {
  if (!crewListEl) return;
  crewListEl.innerHTML = "";

  recalculateCaptainCut();

  crewMembers.forEach((member) => {
    const item = document.createElement("div");
    item.className = "crew-item";

    const nameEl = document.createElement("span");
    nameEl.className = "crew-name";
    nameEl.textContent = member.name;

    const roleSelect = document.createElement("select");
    roleSelect.className = "crew-role-select";
    roleSelect.setAttribute("aria-label", `${member.name} role`);
    roleSelect.title = "Change crew role";

    CREW_ROLES.forEach((role) => {
      const opt = document.createElement("option");
      opt.value = role;
      opt.textContent = role;
      if (member.role === role) {
        opt.selected = true;
      }
      roleSelect.appendChild(opt);
    });

    roleSelect.addEventListener("change", (e) => {
      member.role = e.target.value;
    });

    const meta = document.createElement("div");
    meta.className = "crew-meta";

    const cutWrap = document.createElement("div");
    cutWrap.className = `crew-cut-input-wrap${member.isPrimary ? " auto-calculated" : ""}`;

    const cutInput = document.createElement("input");
    cutInput.type = "number";
    cutInput.className = "crew-cut-input";
    cutInput.min = "0";
    cutInput.max = "100";
    cutInput.step = "1";
    cutInput.value = member.cut !== undefined && member.cut !== null ? String(member.cut) : "0";
    cutInput.setAttribute("aria-label", `${member.name} payout cut percentage`);

    if (member.isPrimary) {
      cutInput.readOnly = true;
      cutInput.dataset.primary = "true";
      cutInput.title = "Auto-calculated captain share (100% - other crew shares)";
    } else {
      cutInput.title = "Edit payout share (%)";
      cutInput.addEventListener("input", (e) => {
        const val = Number(e.target.value);
        member.cut = Number.isNaN(val) ? 0 : Math.max(0, Math.min(100, val));
        recalculateCaptainCut();
        updateCaptainInputDisplay();
      });
      cutInput.addEventListener("change", (e) => {
        const val = Number(e.target.value);
        const clamped = Number.isNaN(val) ? 0 : Math.max(0, Math.min(100, val));
        member.cut = clamped;
        cutInput.value = String(clamped);
        recalculateCaptainCut();
        updateCaptainInputDisplay();
      });
    }

    const cutUnit = document.createElement("span");
    cutUnit.className = "crew-cut-unit";
    cutUnit.textContent = "%";

    cutWrap.append(cutInput, cutUnit);
    meta.append(cutWrap);

    if (!member.isPrimary) {
      const removeBtn = document.createElement("button");
      removeBtn.className = "crew-remove-btn";
      removeBtn.type = "button";
      removeBtn.innerHTML = "&times;";
      removeBtn.title = "Remove member";
      removeBtn.addEventListener("click", () => {
        crewMembers = crewMembers.filter((c) => c.id !== member.id);
        recalculateCaptainCut();
        renderCrewList();
      });
      meta.append(removeBtn);
    }

    item.append(nameEl, roleSelect, meta);
    crewListEl.append(item);
  });

  if (crewTotalCountEl) {
    crewTotalCountEl.textContent = `${crewMembers.length} Member${crewMembers.length === 1 ? "" : "s"}`;
  }
}

renderCrewList();

if (addCrewBtnEl && crewSplashEl) {
  addCrewBtnEl.addEventListener("click", () => {
    if (crewFormEl) {
      crewFormEl.reset();
    }
    crewSplashEl.hidden = false;
  });
}

if (cancelCrewBtnEl && crewSplashEl) {
  cancelCrewBtnEl.addEventListener("click", () => {
    crewSplashEl.hidden = true;
  });
}

if (crewSplashEl) {
  crewSplashEl.addEventListener("click", (event) => {
    if (event.target === crewSplashEl) {
      crewSplashEl.hidden = true;
    }
  });
}

if (crewFormEl && crewSplashEl) {
  crewFormEl.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(crewFormEl);
    const name = String(formData.get("crewName") || "").trim();
    const role = String(formData.get("crewRole") || "Salvage Operator");
    const cutRaw = formData.get("crewCut");
    const cut = cutRaw !== "" && cutRaw !== null && !Number.isNaN(Number(cutRaw)) ? Number(cutRaw) : 0;

    if (!name) return;

    crewMembers.push({
      id: `crew-${Date.now()}`,
      name,
      role,
      cut,
      isPrimary: false
    });

    renderCrewList();
    crewFormEl.reset();
    crewSplashEl.hidden = true;
  });
}

if (workOrderSplashEl) {
  workOrderSplashEl.addEventListener("click", (event) => {
    if (event.target === workOrderSplashEl) {
      workOrderSplashEl.hidden = true;
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (crewSplashEl && !crewSplashEl.hidden) {
      crewSplashEl.hidden = true;
    } else if (expenseSplashEl && !expenseSplashEl.hidden) {
      expenseSplashEl.hidden = true;
    } else if (workOrderSplashEl && !workOrderSplashEl.hidden) {
      workOrderSplashEl.hidden = true;
    } else if (sessionSplashEl && !sessionSplashEl.hidden) {
      handleStartSession();
    }
  }
});

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

if (workOrderFormEl && workOrderSplashEl) {
  workOrderFormEl.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(workOrderFormEl);
    const durationHours = Number(formData.get("durationHours") || 0);
    const durationMinutes = Number(formData.get("durationMinutes") || 0);
    const durationSeconds = (durationHours * 60 * 60) + (durationMinutes * 60);

    if (durationSeconds <= 0) {
      return;
    }

    const costNum = Number(formData.get("cost") || 0);
    const yieldAmountNum = Number(formData.get("yieldAmount") || 0);
    totalRefiningCost += costNum;
    sessionExpenses.refiningCost = (sessionExpenses.refiningCost || 0) + costNum;
    updateExpenseDisplay();

    const order = {
      location: String(formData.get("processingLocation") || ""),
      type: String(formData.get("type") || ""),
      durationHours,
      durationMinutes,
      durationSeconds,
      cost: costNum,
      yieldAmount: yieldAmountNum
    };
    const orderEntry = document.createElement("div");
    const orderLocationHeader = document.createElement("strong");
    const orderMethod = document.createElement("span");
    const orderDetails = document.createElement("span");
    const countdown = document.createElement("span");
    orderEntry.className = "work-order-entry running";
    orderLocationHeader.className = "work-order-location";
    orderLocationHeader.textContent = order.location;
    orderMethod.className = "work-order-method";
    orderMethod.textContent = order.type;
    const durationLabel = [
      order.durationHours ? `${order.durationHours}h` : "",
      order.durationMinutes ? `${order.durationMinutes}m` : ""
    ].filter(Boolean).join(" ");
    const yieldLabel = order.yieldAmount > 0 ? ` | Yield: ${order.yieldAmount} cSCU` : "";
    orderDetails.className = "work-order-meta";
    orderDetails.textContent = `${durationLabel} | ${order.cost.toLocaleString("en-US")} aUEC${yieldLabel}`;
    countdown.className = "work-order-countdown";
    orderEntry.append(orderLocationHeader, orderMethod, orderDetails, countdown);

    if (activeWorkOrdersListEl) {
      activeWorkOrdersListEl.prepend(orderEntry);
    }
    updateWorkOrderListsState();
    startWorkOrderCountdown(order.durationSeconds, countdown, orderEntry);

    workOrderFormEl.reset();
    hoursPicker?.setValue(0, false);
    minutesPicker?.setValue(45, false);
    workOrderSplashEl.hidden = true;
  });
}

updateWorkOrderListsState();
