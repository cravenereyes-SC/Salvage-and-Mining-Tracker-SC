import {
  getSavedSessions,
  summarizeSession,
  summarizeAllSessions
} from "./modules/sessionsStore.js";
import {
  applyTheme,
  applyVisualSettings,
  clearCustomVisualSettings,
  getSavedCustomThemeActive,
  getSavedThemeId,
  getSavedVisualSettings
} from "./modules/themes.js";

const backBtnEl = document.querySelector("#back-btn");
const totalsStripEl = document.querySelector("#totals-strip");
const sessionsListEl = document.querySelector("#sessions-list");
const emptyStateEl = document.querySelector("#empty-state");
const sessionCountEl = document.querySelector("#session-count");
const detailDialogEl = document.querySelector("#session-detail-dialog");
const detailTitleEl = document.querySelector("#session-detail-title");
const detailContentEl = document.querySelector("#session-detail-content");
const closeDetailBtnEl = document.querySelector("#close-session-detail");

const sessions = getSavedSessions();

const currencyFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const dateTimeFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

const STATUS_SORT_ORDER = { active: 0, completed: 1, failed: 2 };

function formatAuec(value) {
  return `${currencyFormatter.format(value)} aUEC`;
}

function formatDateTime(isoString) {
  if (!isoString) {
    return "—";
  }

  const date = new Date(isoString);
  return Number.isNaN(date.getTime()) ? "—" : dateTimeFormatter.format(date);
}

function createEl(tag, className, text) {
  const node = document.createElement(tag);

  if (className) {
    node.className = className;
  }

  if (text !== undefined) {
    node.textContent = String(text);
  }

  return node;
}

function createStatusBadge(status) {
  return createEl("span", `status-badge status-${status}`, status);
}

function createMetaItem(label, value) {
  const item = createEl("div", "meta-item");
  item.append(createEl("span", "meta-label", label));
  item.append(createEl("span", "meta-value", value));
  return item;
}

function createFinanceItem(label, value, toneClass) {
  const item = createEl("div", "finance-item");
  item.append(createEl("span", "finance-label", label));
  item.append(createEl("span", `finance-value ${toneClass}`, formatAuec(value)));
  return item;
}

function createStatBox(label, value, valueClass) {
  const box = createEl("div", "stat-box");
  box.append(createEl("span", "stat-label", label));
  box.append(createEl("span", valueClass ? `stat-number ${valueClass}` : "stat-number", value));
  return box;
}

function sortSessions(list) {
  return [...list].sort((a, b) => {
    const statusDiff = (STATUS_SORT_ORDER[a.status] ?? 3) - (STATUS_SORT_ORDER[b.status] ?? 3);

    if (statusDiff !== 0) {
      return statusDiff;
    }

    return new Date(b.startedAt || 0) - new Date(a.startedAt || 0);
  });
}

function renderTotals() {
  if (!totalsStripEl) {
    return;
  }

  const totals = summarizeAllSessions(sessions);
  totalsStripEl.innerHTML = "";
  totalsStripEl.append(
    createStatBox("Total Profit", formatAuec(totals.profit), "tone-profit"),
    createStatBox("Total Loss", formatAuec(totals.loss), "tone-loss"),
    createStatBox("Total Expenses", formatAuec(totals.expenses), "tone-expenses"),
    createStatBox("Net", formatAuec(totals.net), totals.net >= 0 ? "tone-profit" : "tone-loss"),
    createStatBox("Active", totals.activeSessions, "status-text-active"),
    createStatBox("Completed", totals.completedSessions, "status-text-completed"),
    createStatBox("Failed", totals.failedSessions, "status-text-failed")
  );
}

function renderSessionCard(session) {
  const summary = summarizeSession(session);

  const card = createEl("article", "session-card card");

  const header = createEl("div", "session-card-header");
  header.append(createEl("h2", "session-card-title", session.title));
  header.append(createStatusBadge(session.status));
  card.append(header);

  const meta = createEl("div", "session-meta");
  meta.append(
    createMetaItem("Location", session.location),
    createMetaItem("Started", formatDateTime(session.startedAt)),
    createMetaItem("Ended", session.endedAt ? formatDateTime(session.endedAt) : "—"),
    createMetaItem("Focus", session.focus)
  );
  card.append(meta);

  const finance = createEl("div", "session-finance");
  finance.append(
    createFinanceItem("Profit", summary.profit, "tone-profit"),
    createFinanceItem("Loss", summary.loss, "tone-loss"),
    createFinanceItem("Expenses", summary.expenses, "tone-expenses"),
    createFinanceItem("Net", summary.net, summary.net >= 0 ? "tone-profit" : "tone-loss")
  );
  card.append(finance);

  const stats = createEl("div", "work-order-stats");
  stats.append(
    createStatBox("Active Orders", summary.activeOrders),
    createStatBox("Completed Orders", summary.completedOrders),
    createStatBox("Failed Orders", summary.failedOrders),
    createStatBox("Picked Up", summary.pickedUp),
    createStatBox("Not Picked Up", summary.notPickedUp)
  );
  card.append(stats);

  const footer = createEl("div", "session-card-footer");
  const detailsBtn = createEl("button", "hud-settings-trigger session-details-btn", "View Details");
  detailsBtn.type = "button";
  detailsBtn.dataset.sessionId = session.id;
  footer.append(detailsBtn);
  card.append(footer);

  return card;
}

function renderSessionsList() {
  if (!sessionsListEl) {
    return;
  }

  sessionsListEl.innerHTML = "";
  sortSessions(sessions).forEach((session) => {
    sessionsListEl.append(renderSessionCard(session));
  });
}

function buildDetailContent(session) {
  if (!detailContentEl || !detailTitleEl) {
    return;
  }

  const summary = summarizeSession(session);
  detailTitleEl.textContent = session.title;
  detailContentEl.innerHTML = "";

  const headRow = createEl("div", "session-card-header");
  headRow.append(createStatusBadge(session.status));
  detailContentEl.append(headRow);

  detailContentEl.append(createEl("h3", "detail-section-title", "Session Info"));
  const meta = createEl("div", "session-meta");
  meta.append(
    createMetaItem("Location", session.location),
    createMetaItem("Focus", session.focus),
    createMetaItem("Started", formatDateTime(session.startedAt)),
    createMetaItem("Ended", session.endedAt ? formatDateTime(session.endedAt) : "—")
  );
  detailContentEl.append(meta);

  detailContentEl.append(createEl("h3", "detail-section-title", "Financials"));
  const finance = createEl("div", "session-finance");
  finance.style.borderTop = "none";
  finance.style.paddingTop = "0";
  finance.append(
    createFinanceItem("Profit", summary.profit, "tone-profit"),
    createFinanceItem("Loss", summary.loss, "tone-loss"),
    createFinanceItem("Expenses", summary.expenses, "tone-expenses"),
    createFinanceItem("Net", summary.net, summary.net >= 0 ? "tone-profit" : "tone-loss")
  );
  detailContentEl.append(finance);

  detailContentEl.append(createEl("h3", "detail-section-title", `Work Orders (${summary.totalOrders})`));

  if (session.workOrders.length === 0) {
    detailContentEl.append(createEl("p", "detail-wo-empty", "No work orders recorded in this session."));
    return;
  }

  const woList = createEl("ul", "detail-wo-list");
  session.workOrders.forEach((order) => {
    const row = createEl("li", "detail-wo-row");

    const main = createEl("div", "detail-wo-main");
    main.append(createEl("p", "detail-wo-name", order.name));
    main.append(createEl("p", "detail-wo-sub", `${order.location} • ${order.timeRemaining}`));

    const side = createEl("div", "detail-wo-side");
    side.append(createStatusBadge(order.status));
    side.append(createEl(
      "span",
      `pickup-badge ${order.pickedUp ? "picked" : "awaiting"}`,
      order.pickedUp ? "Picked Up" : "Not Picked Up"
    ));
    side.append(createEl("span", "detail-wo-money", `Payout ${formatAuec(order.payout)}`));
    side.append(createEl("span", "detail-wo-money", `Cost ${formatAuec(order.cost)}`));

    row.append(main, side);
    woList.append(row);
  });
  detailContentEl.append(woList);
}

function openSessionDetail(sessionId) {
  const session = sessions.find((entry) => entry.id === sessionId);

  if (!session || !detailDialogEl) {
    return;
  }

  buildDetailContent(session);
  detailDialogEl.showModal();
}

const resolvedTheme = getSavedThemeId("rsi");
applyTheme(resolvedTheme);

if (getSavedCustomThemeActive()) {
  applyVisualSettings(getSavedVisualSettings());
}
else {
  clearCustomVisualSettings();
}

const hasSessions = sessions.length > 0;

if (sessionCountEl) {
  sessionCountEl.textContent = `${sessions.length} session${sessions.length === 1 ? "" : "s"}`;
}

if (emptyStateEl) {
  emptyStateEl.hidden = hasSessions;
}

if (totalsStripEl) {
  totalsStripEl.hidden = !hasSessions;
}

if (sessionsListEl) {
  sessionsListEl.hidden = !hasSessions;
}

renderTotals();
renderSessionsList();

if (backBtnEl) {
  backBtnEl.addEventListener("click", () => {
    if (window.opener && !window.opener.closed) {
      window.close();
      return;
    }

    window.location.href = "index.html";
  });
}

if (sessionsListEl) {
  sessionsListEl.addEventListener("click", (event) => {
    const detailsBtn = event.target.closest(".session-details-btn");

    if (detailsBtn) {
      openSessionDetail(detailsBtn.dataset.sessionId);
    }
  });
}

if (closeDetailBtnEl && detailDialogEl) {
  closeDetailBtnEl.addEventListener("click", () => {
    detailDialogEl.close();
  });
}

if (detailDialogEl) {
  detailDialogEl.addEventListener("click", (event) => {
    if (event.target === detailDialogEl) {
      detailDialogEl.close();
    }
  });
}
