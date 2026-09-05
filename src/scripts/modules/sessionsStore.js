const SESSIONS_STORAGE_KEY = "sc-tracker-sessions";

export const SESSION_STATUSES = ["active", "completed", "failed"];
export const WORK_ORDER_STATUSES = ["active", "completed", "failed"];

function toFiniteNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toIsoStringOrNull(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeStatus(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

export function normalizeWorkOrder(order, index = 0) {
  const source = order && typeof order === "object" ? order : {};

  return {
    id: typeof source.id === "string" && source.id ? source.id : `wo-${index + 1}`,
    name: String(source.name || "Untitled Work Order"),
    location: String(source.location || "Unknown"),
    timeRemaining: String(source.timeRemaining || "--"),
    status: normalizeStatus(source.status, WORK_ORDER_STATUSES, "active"),
    pickedUp: Boolean(source.pickedUp),
    payout: toFiniteNumber(source.payout),
    cost: toFiniteNumber(source.cost)
  };
}

export function normalizeSession(session, index = 0) {
  const source = session && typeof session === "object" ? session : {};
  const workOrders = Array.isArray(source.workOrders)
    ? source.workOrders.map((order, orderIndex) => normalizeWorkOrder(order, orderIndex))
    : [];

  return {
    id: typeof source.id === "string" && source.id ? source.id : `session-${index + 1}`,
    title: String(source.title || "Untitled Session"),
    location: String(source.location || "Unknown"),
    focus: String(source.focus || "General Ops"),
    startedAt: toIsoStringOrNull(source.startedAt),
    endedAt: toIsoStringOrNull(source.endedAt),
    status: normalizeStatus(source.status, SESSION_STATUSES, "active"),
    profit: toFiniteNumber(source.profit),
    loss: toFiniteNumber(source.loss),
    expenses: toFiniteNumber(source.expenses),
    workOrders
  };
}

export function getSavedSessions() {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((session, index) => normalizeSession(session, index));
  }
  catch {
    return [];
  }
}

export function saveSessions(sessions) {
  const normalized = (Array.isArray(sessions) ? sessions : []).map((session, index) => normalizeSession(session, index));
  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function summarizeSession(session) {
  const normalized = normalizeSession(session);
  const workOrders = normalized.workOrders;

  return {
    profit: normalized.profit,
    loss: normalized.loss,
    expenses: normalized.expenses,
    net: normalized.profit - normalized.loss - normalized.expenses,
    totalOrders: workOrders.length,
    activeOrders: workOrders.filter((order) => order.status === "active").length,
    completedOrders: workOrders.filter((order) => order.status === "completed").length,
    failedOrders: workOrders.filter((order) => order.status === "failed").length,
    pickedUp: workOrders.filter((order) => order.pickedUp).length,
    notPickedUp: workOrders.filter((order) => !order.pickedUp).length
  };
}

export function summarizeAllSessions(sessions) {
  const normalized = (Array.isArray(sessions) ? sessions : []).map((session, index) => normalizeSession(session, index));

  const totals = normalized.reduce((accumulator, session) => {
    const summary = summarizeSession(session);
    accumulator.profit += summary.profit;
    accumulator.loss += summary.loss;
    accumulator.expenses += summary.expenses;
    accumulator.net += summary.net;
    accumulator.totalOrders += summary.totalOrders;
    accumulator.activeOrders += summary.activeOrders;
    accumulator.completedOrders += summary.completedOrders;
    accumulator.failedOrders += summary.failedOrders;
    accumulator.pickedUp += summary.pickedUp;
    accumulator.notPickedUp += summary.notPickedUp;
    return accumulator;
  }, {
    profit: 0,
    loss: 0,
    expenses: 0,
    net: 0,
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    failedOrders: 0,
    pickedUp: 0,
    notPickedUp: 0
  });

  return {
    ...totals,
    totalSessions: normalized.length,
    activeSessions: normalized.filter((session) => session.status === "active").length,
    completedSessions: normalized.filter((session) => session.status === "completed").length,
    failedSessions: normalized.filter((session) => session.status === "failed").length
  };
}
