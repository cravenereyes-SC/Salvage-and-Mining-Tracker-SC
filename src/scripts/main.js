import { createInitialState } from "./modules/state.js";
import { renderAppStatus } from "./modules/app.js";
import { SHIP_CATALOG } from "./modules/shipCatalog.js";
import {
	applyTheme,
	applyVisualSettings,
	clearCustomVisualSettings,
	getDefaultVisualSettings,
	getSavedCustomThemeActive,
	getThemeDescription,
	getSavedThemeId,
	getSavedVisualSettings,
	populateThemeSelector,
	saveCustomThemeActive,
	saveThemeId,
	saveVisualSettings
} from "./modules/themes.js";

const PILOT_STORAGE_KEY = "sc-tracker-pilot-profile";
const HANGAR_STORAGE_KEY = "sc-tracker-owned-ships";
const SESSION_STORAGE_KEY = "sc-tracker-session-profile";
const SESSION_HISTORY_STORAGE_KEY = "sc-tracker-session-history";

const state = createInitialState();

const gearButtonEl = document.querySelector("#theme-gear-button");
const themeDropdownEl = document.querySelector("#theme-dropdown");
const themeSelectEl = document.querySelector("#theme-select");
const applyThemeBtnEl = document.querySelector("#apply-theme");
const customizeThemeBtnEl = document.querySelector("#customize-theme");
const themeDescriptionEl = document.querySelector("#theme-description");
const settingsDialogEl = document.querySelector("#settings-dialog");
const resetSettingsBtnEl = document.querySelector("#reset-settings");
const glowRangeEl = document.querySelector("#glow-strength");
const scanlineRangeEl = document.querySelector("#scanline-strength");
const accentColorEl = document.querySelector("#accent-color");
const backgroundColorEl = document.querySelector("#background-color");
const glowValueEl = document.querySelector("#glow-strength-value");
const scanlineValueEl = document.querySelector("#scanline-strength-value");
const accentColorValueEl = document.querySelector("#accent-color-value");
const backgroundColorValueEl = document.querySelector("#background-color-value");
const pilotCallsignEl = document.querySelector("#pilot-callsign");
const pilotOrganizationEl = document.querySelector("#pilot-organization");
const pilotShipEl = document.querySelector("#pilot-ship");
const pilotSystemEl = document.querySelector("#pilot-system");
const pilotTagsEl = document.querySelector("#pilot-tags");
const editPilotBtnEl = document.querySelector("#edit-pilot-btn");
const pilotSettingsDialogEl = document.querySelector("#pilot-settings-dialog");
const pilotSettingsFormEl = document.querySelector("#pilot-settings-form");
const cancelPilotSettingsBtnEl = document.querySelector("#cancel-pilot-settings");
const pilotCallsignInputEl = document.querySelector("#pilot-callsign-input");
const pilotOrganizationInputEl = document.querySelector("#pilot-organization-input");
const pilotShipInputEl = document.querySelector("#pilot-ship-input");
const pilotSystemInputEl = document.querySelector("#pilot-system-input");
const pilotSpecialtiesInputEl = document.querySelector("#pilot-specialties-input");
const ownedShipsListEl = document.querySelector("#owned-ships-list");
const sessionStatusEl = document.querySelector("#session-status");
const sessionFocusEl = document.querySelector("#session-focus");
const sessionRouteEl = document.querySelector("#session-route");
const sessionLastUpdatedEl = document.querySelector("#session-last-updated");
const sessionNotesEl = document.querySelector("#session-notes");
const sessionHistoryOpenEl = document.querySelector("#session-history-open");
const sessionHistoryClosedEl = document.querySelector("#session-history-closed");
const sessionHistoryFailedEl = document.querySelector("#session-history-failed");
const editSessionBtnEl = document.querySelector("#edit-session-btn");
const sessionSettingsDialogEl = document.querySelector("#session-settings-dialog");
const sessionSettingsFormEl = document.querySelector("#session-settings-form");
const cancelSessionSettingsBtnEl = document.querySelector("#cancel-session-settings");
const sessionStatusInputEl = document.querySelector("#session-status-input");
const sessionFocusInputEl = document.querySelector("#session-focus-input");
const sessionRouteInputEl = document.querySelector("#session-route-input");
const sessionNotesInputEl = document.querySelector("#session-notes-input");
const sessionIncomeInputEl = document.querySelector("#session-income-input");
const sessionCostInputEl = document.querySelector("#session-cost-input");
const editHangarBtnEl = document.querySelector("#edit-hangar-btn");
const hangarSettingsDialogEl = document.querySelector("#hangar-settings-dialog");
const hangarSettingsFormEl = document.querySelector("#hangar-settings-form");
const closeHangarSettingsBtnEl = document.querySelector("#close-hangar-settings");
const cancelHangarSettingsBtnEl = document.querySelector("#cancel-hangar-settings");
const hangarShipsListEl = document.querySelector("#hangar-ships-list");
const openPurchaseShipBtnEl = document.querySelector("#open-purchase-ship");
const purchaseShipDialogEl = document.querySelector("#purchase-ship-dialog");
const purchaseShipFormEl = document.querySelector("#purchase-ship-form");
const purchaseShipSelectEl = document.querySelector("#purchase-ship-select");
const purchaseShipHelpEl = document.querySelector("#purchase-ship-help");
const cancelPurchaseShipBtnEl = document.querySelector("#cancel-purchase-ship");

const resolvedTheme = getSavedThemeId(state.defaultTheme);
const savedVisualSettings = getSavedVisualSettings();
const savedCustomThemeActive = getSavedCustomThemeActive();

state.selectedTheme = resolvedTheme;
state.customThemeActive = savedCustomThemeActive;
state.visualSettings = savedVisualSettings;

let pendingThemeSelection = state.customThemeActive ? "custom" : state.selectedTheme;

function toSpecialtyList(value) {
	if (Array.isArray(value)) {
		return value
			.map((entry) => String(entry).trim())
			.filter((entry) => entry.length > 0)
			.slice(0, 8);
	}

	if (typeof value === "string") {
		return value
			.split(",")
			.map((entry) => entry.trim())
			.filter((entry) => entry.length > 0)
			.slice(0, 8);
	}

	return [];
}

function toShipList(value) {
	if (Array.isArray(value)) {
		return value.slice(0, 60);
	}

	if (typeof value === "string") {
		return value
			.split(/\r?\n/)
			.map((entry) => entry.trim())
			.filter((entry) => entry.length > 0)
			.slice(0, 60);
	}

	return [];
}

function toShipObjectFromName(shipName) {
	const cleanName = String(shipName || "").trim();
	const found = SHIP_CATALOG.find((ship) => ship.name.toLowerCase() === cleanName.toLowerCase());

	if (found) {
		return { ...found };
	}

	const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
	return {
		id: slug || `custom-ship-${Date.now()}`,
		name: cleanName || "Unknown Ship",
		manufacturer: "Unknown",
		role: "General",
		size: "Unknown"
	};
}

function normalizeOwnedShips(rawShips) {
	if (!Array.isArray(rawShips)) {
		return [];
	}

	return rawShips
		.map((entry) => {
			if (typeof entry === "string") {
				return toShipObjectFromName(entry);
			}

			if (entry && typeof entry === "object") {
				const fromCatalog = SHIP_CATALOG.find((ship) => ship.id === entry.id || ship.name === entry.name);
				if (fromCatalog) {
					return { ...fromCatalog };
				}

				const name = String(entry.name || "").trim();
				if (!name) {
					return null;
				}

				return {
					id: String(entry.id || name.toLowerCase().replace(/[^a-z0-9]+/g, "-")).trim(),
					name,
					manufacturer: String(entry.manufacturer || "Unknown").trim(),
					role: String(entry.role || "General").trim(),
					size: String(entry.size || "Unknown").trim()
				};
			}

			return null;
		})
		.filter((entry) => Boolean(entry))
		.slice(0, 60);
}

function sanitizePilotProfile(rawProfile, fallbackProfile) {
	const safeFallback = fallbackProfile || state.pilotProfile;

	return {
		callsign: String(rawProfile?.callsign || safeFallback.callsign || "Unknown Pilot").trim(),
		organization: String(rawProfile?.organization || safeFallback.organization || "Independent Contractor").trim(),
		primaryShip: String(rawProfile?.primaryShip || safeFallback.primaryShip || "Unassigned").trim(),
		homeSystem: String(rawProfile?.homeSystem || safeFallback.homeSystem || "Stanton").trim(),
		specialties: toSpecialtyList(rawProfile?.specialties || safeFallback.specialties)
	};
}

function renderPilotProfile() {
	if (!pilotCallsignEl || !pilotOrganizationEl || !pilotShipEl || !pilotSystemEl || !pilotTagsEl) {
		return;
	}

	pilotCallsignEl.textContent = state.pilotProfile.callsign;
	pilotOrganizationEl.textContent = state.pilotProfile.organization;
	pilotShipEl.textContent = state.pilotProfile.primaryShip;
	pilotSystemEl.textContent = state.pilotProfile.homeSystem;

	pilotTagsEl.innerHTML = "";

	if (state.pilotProfile.specialties.length === 0) {
		const emptyTag = document.createElement("span");
		emptyTag.className = "pilot-tag";
		emptyTag.textContent = "No specialties set";
		pilotTagsEl.append(emptyTag);
		return;
	}

	state.pilotProfile.specialties.forEach((specialty) => {
		const tag = document.createElement("span");
		tag.className = "pilot-tag";
		tag.textContent = specialty;
		pilotTagsEl.append(tag);
	});
}

function normalizeSessionStatus(value) {
	const normalized = String(value || "Open").trim().toLowerCase();

	if (normalized === "closed") {
		return "Closed";
	}

	if (normalized === "failed") {
		return "Failed";
	}

	return "Open";
}

function parseAuecAmount(value) {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}

	const parsed = Number.parseFloat(String(value || "0").replace(/[^0-9.-]/g, ""));
	return Number.isFinite(parsed) ? parsed : 0;
}

function formatAuec(value) {
	return `${Math.round(value).toLocaleString()} aUEC`;
}

function sanitizeFinancialCategories(rawCategories, fallbackLabel) {
	if (!Array.isArray(rawCategories)) {
		return [];
	}

	return rawCategories
		.map((entry, index) => {
			if (!entry) {
				return null;
			}

			if (typeof entry === "string") {
				const amount = parseAuecAmount(entry);
				if (amount <= 0) {
					return null;
				}

				return {
					label: `${fallbackLabel} ${index + 1}`,
					amount
				};
			}

			const amount = parseAuecAmount(entry.amount);
			if (amount <= 0) {
				return null;
			}

			return {
				label: String(entry.label || `${fallbackLabel} ${index + 1}`).trim() || `${fallbackLabel} ${index + 1}`,
				amount
			};
		})
		.filter((entry) => Boolean(entry))
		.slice(0, 20);
}

function parseFinancialCategoriesFromInput(value, fallbackLabel) {
	if (typeof value !== "string") {
		return [];
	}

	return value
		.split(/\r?\n|;/)
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0)
		.map((entry, index) => {
			const [rawLabel, ...rawAmountParts] = entry.split(":");
			const amountText = rawAmountParts.length > 0 ? rawAmountParts.join(":") : rawLabel;
			const amount = parseAuecAmount(amountText);

			if (amount <= 0) {
				return null;
			}

			return {
				label: String(rawAmountParts.length > 0 ? rawLabel : `${fallbackLabel} ${index + 1}`).trim() || `${fallbackLabel} ${index + 1}`,
				amount
			};
		})
		.filter((entry) => Boolean(entry))
		.slice(0, 20);
}

function categoriesToInputValue(categories) {
	if (!Array.isArray(categories) || categories.length === 0) {
		return "";
	}

	return categories
		.map((entry) => `${entry.label}: ${Math.round(entry.amount)}`)
		.join("\n");
}

function sumCategoryAmounts(categories) {
	if (!Array.isArray(categories)) {
		return 0;
	}

	return categories.reduce((total, entry) => total + parseAuecAmount(entry?.amount), 0);
}

function getSessionFinancialSummary(entry) {
	const incomeTotal = sumCategoryAmounts(entry?.incomeCategories);
	const costTotal = sumCategoryAmounts(entry?.costCategories);
	const netTotal = incomeTotal - costTotal;

	return {
		incomeTotal,
		costTotal,
		netTotal
	};
}

function sanitizeSessionProfile(rawProfile, fallbackProfile) {
	const safeFallback = fallbackProfile || state.sessionProfile;

	return {
		status: normalizeSessionStatus(rawProfile?.status || safeFallback.status || "Open"),
		focus: String(rawProfile?.focus || safeFallback.focus || "No focus set").trim(),
		route: String(rawProfile?.route || safeFallback.route || "Unspecified").trim(),
		notes: String(rawProfile?.notes || safeFallback.notes || "No notes added yet.").trim(),
		lastUpdated: String(rawProfile?.lastUpdated || safeFallback.lastUpdated || new Date().toLocaleString()).trim(),
		incomeCategories: sanitizeFinancialCategories(rawProfile?.incomeCategories || safeFallback.incomeCategories, "Income"),
		costCategories: sanitizeFinancialCategories(rawProfile?.costCategories || safeFallback.costCategories, "Cost")
	};
}

function renderSessionProfile() {
	if (!sessionStatusEl || !sessionFocusEl || !sessionRouteEl || !sessionLastUpdatedEl || !sessionNotesEl) {
		return;
	}

	sessionStatusEl.textContent = state.sessionProfile.status || "Active";
	sessionFocusEl.textContent = state.sessionProfile.focus || "No focus set";
	sessionRouteEl.textContent = state.sessionProfile.route || "Unspecified";
	sessionLastUpdatedEl.textContent = state.sessionProfile.lastUpdated || "Not recorded";
	sessionNotesEl.textContent = state.sessionProfile.notes || "No notes added yet.";
}

function sanitizeSessionHistory(rawHistory) {
	if (!Array.isArray(rawHistory)) {
		return [];
	}

	return rawHistory
		.map((entry) => {
			if (!entry || typeof entry !== "object") {
				return null;
			}

			const legacyPayoutAmount = parseAuecAmount(entry.payout);
			const incomeCategories = sanitizeFinancialCategories(entry.incomeCategories, "Income");
			if (incomeCategories.length === 0 && legacyPayoutAmount > 0) {
				incomeCategories.push({ label: "Payout", amount: legacyPayoutAmount });
			}

			const costCategories = sanitizeFinancialCategories(entry.costCategories, "Cost");
			const netTotal = sumCategoryAmounts(incomeCategories) - sumCategoryAmounts(costCategories);

			return {
				id: String(entry.id || `${String(entry.status || "open").toLowerCase()}-${Math.random().toString(16).slice(2)}`).trim(),
				title: String(entry.title || entry.focus || "Session").trim(),
				status: normalizeSessionStatus(entry.status),
				focus: String(entry.focus || "Unspecified").trim(),
				route: String(entry.route || "Unspecified").trim(),
				summary: String(entry.summary || entry.notes || "Session details available.").trim(),
				duration: String(entry.duration || "—").trim(),
				payout: formatAuec(netTotal),
				incomeCategories,
				costCategories,
				updatedAt: String(entry.updatedAt || entry.date || new Date().toLocaleDateString()).trim()
			};
		})
		.filter((entry) => Boolean(entry))
		.slice(0, 12);
}

function selectSessionHistoryEntry(entryId) {
	const selectedEntry = state.sessionHistory.find((entry) => entry.id === entryId);
	if (!selectedEntry) {
		return;
	}

	state.sessionProfile = sanitizeSessionProfile(
		{
			status: selectedEntry.status,
			focus: selectedEntry.focus,
			route: selectedEntry.route,
			notes: `${selectedEntry.summary} ${selectedEntry.duration ? `Duration: ${selectedEntry.duration}.` : ""}`.trim(),
			incomeCategories: selectedEntry.incomeCategories,
			costCategories: selectedEntry.costCategories,
			lastUpdated: selectedEntry.updatedAt
		},
		state.sessionProfile
	);

	persistSessionProfile();
	renderSessionProfile();
	state.selectedSessionId = entryId;
	renderSessionHistory();
}

function updateSessionHistoryEntry(entryId, nextStatus) {
	const selectedEntry = state.sessionHistory.find((entry) => entry.id === entryId);
	if (!selectedEntry) {
		return;
	}

	const currentStatus = normalizeSessionStatus(selectedEntry.status);
	const normalizedNextStatus = normalizeSessionStatus(nextStatus);

	const canCloseOrFail = currentStatus === "Open" && (normalizedNextStatus === "Closed" || normalizedNextStatus === "Failed");
	const canReopen = (currentStatus === "Closed" || currentStatus === "Failed") && normalizedNextStatus === "Open";

	if (!canCloseOrFail && !canReopen) {
		return;
	}

	selectedEntry.status = normalizedNextStatus;
	selectedEntry.updatedAt = new Date().toLocaleDateString();

	const financialSummary = getSessionFinancialSummary(selectedEntry);
	selectedEntry.payout = formatAuec(financialSummary.netTotal);

	if (state.selectedSessionId === selectedEntry.id) {
		state.sessionProfile.status = normalizedNextStatus;
		state.sessionProfile.lastUpdated = selectedEntry.updatedAt;
		persistSessionProfile();
		renderSessionProfile();
	}

	persistSessionHistory();
	renderSessionHistory();
}

function renderSessionHistory() {
	const containers = [
		{ status: "Open", element: sessionHistoryOpenEl },
		{ status: "Closed", element: sessionHistoryClosedEl },
		{ status: "Failed", element: sessionHistoryFailedEl }
	];

	containers.forEach(({ status, element }) => {
		if (!element) {
			return;
		}

		element.innerHTML = "";

		const matchingEntries = Array.isArray(state.sessionHistory)
			? state.sessionHistory.filter((entry) => String(entry.status || "Open").toLowerCase() === status.toLowerCase())
			: [];

		if (matchingEntries.length === 0) {
			const emptyItem = document.createElement("li");
			emptyItem.className = "session-history-item session-history-empty";
			emptyItem.textContent = `No ${status.toLowerCase()} sessions recorded yet.`;
			element.append(emptyItem);
			return;
		}

		matchingEntries.forEach((entry) => {
			const normalizedStatus = normalizeSessionStatus(entry.status);
			const finance = getSessionFinancialSummary(entry);
			const netLabel = finance.netTotal >= 0 ? "Profit" : "Loss";

			const item = document.createElement("li");
			item.className = "session-history-item";

			const card = document.createElement("button");
			card.type = "button";
			card.className = `session-history-card${state.selectedSessionId === entry.id ? " session-history-card--active" : ""}`;
			card.dataset.entryId = entry.id;
			card.setAttribute("aria-label", `View ${entry.title || "session"}`);

			const header = document.createElement("div");
			header.className = "session-history-item-header";

			const title = document.createElement("strong");
			title.textContent = entry.title || "Session";

			const badge = document.createElement("span");
			badge.className = `session-history-badge session-history-badge--${normalizedStatus.toLowerCase()}`;
			badge.textContent = normalizedStatus || status;

			header.append(title, badge);

			const meta = document.createElement("p");
			meta.className = "session-history-meta";
			meta.textContent = `${entry.focus || "Unspecified"} • ${entry.route || "Unspecified"}`;

			const summary = document.createElement("p");
			summary.className = "session-history-summary";
			summary.textContent = entry.summary || "Session details available.";

			const details = document.createElement("p");
			details.className = "session-history-details";
			details.textContent = `${entry.duration ? `Duration: ${entry.duration}` : "Duration: —"} • Income: ${formatAuec(finance.incomeTotal)} • Costs: ${formatAuec(finance.costTotal)}`;

			const profitLoss = document.createElement("p");
			profitLoss.className = `session-history-profit ${finance.netTotal < 0 ? "session-history-profit--loss" : "session-history-profit--profit"}`;
			profitLoss.textContent = `${netLabel}: ${formatAuec(Math.abs(finance.netTotal))}`;

			const date = document.createElement("p");
			date.className = "session-history-date";
			date.textContent = entry.updatedAt || "No date recorded";

			const actions = document.createElement("div");
			actions.className = "session-history-actions";

			if (normalizedStatus === "Open") {
				const closeBtn = document.createElement("button");
				closeBtn.type = "button";
				closeBtn.className = "session-history-action";
				closeBtn.dataset.entryId = entry.id;
				closeBtn.dataset.nextStatus = "Closed";
				closeBtn.textContent = "Mark Closed";

				const failBtn = document.createElement("button");
				failBtn.type = "button";
				failBtn.className = "session-history-action session-history-action--danger";
				failBtn.dataset.entryId = entry.id;
				failBtn.dataset.nextStatus = "Failed";
				failBtn.textContent = "Mark Failed";

				actions.append(closeBtn, failBtn);
			}

			if (normalizedStatus === "Closed" || normalizedStatus === "Failed") {
				const reopenBtn = document.createElement("button");
				reopenBtn.type = "button";
				reopenBtn.className = "session-history-action session-history-action--reopen";
				reopenBtn.dataset.entryId = entry.id;
				reopenBtn.dataset.nextStatus = "Open";
				reopenBtn.textContent = "Reopen Session";

				actions.append(reopenBtn);
			}

			card.append(header, meta, summary, details, profitLoss, date);

			if (actions.childElementCount > 0) {
				item.append(card, actions);
			}
			else {
				item.append(card);
			}

			element.append(item);
		});
	});
}

function persistSessionProfile() {
	localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state.sessionProfile));
}

function persistSessionHistory() {
	localStorage.setItem(SESSION_HISTORY_STORAGE_KEY, JSON.stringify(state.sessionHistory));
}

function syncSessionFormFromState() {
	if (sessionStatusInputEl) {
		sessionStatusInputEl.value = state.sessionProfile.status;
	}

	if (sessionFocusInputEl) {
		sessionFocusInputEl.value = state.sessionProfile.focus;
	}

	if (sessionRouteInputEl) {
		sessionRouteInputEl.value = state.sessionProfile.route;
	}

	if (sessionNotesInputEl) {
		sessionNotesInputEl.value = state.sessionProfile.notes;
	}

	if (sessionIncomeInputEl) {
		sessionIncomeInputEl.value = categoriesToInputValue(state.sessionProfile.incomeCategories);
	}

	if (sessionCostInputEl) {
		sessionCostInputEl.value = categoriesToInputValue(state.sessionProfile.costCategories);
	}
}

function renderOwnedShips() {
	if (!ownedShipsListEl) {
		return;
	}

	ownedShipsListEl.innerHTML = "";

	if (!Array.isArray(state.ownedShips) || state.ownedShips.length === 0) {
		const emptyItem = document.createElement("li");
		emptyItem.className = "ship-item";
		emptyItem.textContent = "No ships added";
		ownedShipsListEl.append(emptyItem);
		return;
	}

	state.ownedShips.forEach((ship) => {
		const item = document.createElement("li");
		item.className = "ship-item";
		item.textContent = `${ship.name} | ${ship.manufacturer} | ${ship.role}`;
		ownedShipsListEl.append(item);
	});
}

function persistOwnedShips() {
	localStorage.setItem(HANGAR_STORAGE_KEY, JSON.stringify(state.ownedShips));
}

function renderHangarEditorShips() {
	if (!hangarShipsListEl) {
		return;
	}

	hangarShipsListEl.innerHTML = "";

	if (!Array.isArray(state.ownedShips) || state.ownedShips.length === 0) {
		const empty = document.createElement("p");
		empty.className = "hangar-empty";
		empty.textContent = "No ships in your hangar. Use Purchase Ship to add one.";
		hangarShipsListEl.append(empty);
		return;
	}

	state.ownedShips.forEach((ship, index) => {
		const card = document.createElement("article");
		card.className = "hangar-ship-card";

		const name = document.createElement("p");
		name.className = "hangar-ship-name";
		name.textContent = ship.name;

		const meta = document.createElement("p");
		meta.className = "hangar-ship-meta";
		meta.textContent = `${ship.manufacturer} | ${ship.role} | ${ship.size}`;

		const removeBtn = document.createElement("button");
		removeBtn.type = "button";
		removeBtn.className = "hud-settings-trigger remove-ship-btn";
		removeBtn.dataset.shipIndex = String(index);
		removeBtn.setAttribute("aria-label", `Remove ${ship.name}`);
		removeBtn.title = `Remove ${ship.name}`;
		removeBtn.innerHTML = `
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M3 6h18" />
				<path d="M8 6V4h8v2" />
				<path d="M6 6l1 14h10l1-14" />
				<path d="M10 10v7" />
				<path d="M14 10v7" />
			</svg>
			<span class="visually-hidden">Remove Ship</span>
		`;

		card.append(name, meta, removeBtn);
		hangarShipsListEl.append(card);
	});
}

function syncPurchaseShipOptions() {
	if (!purchaseShipSelectEl) {
		return;
	}

	purchaseShipSelectEl.innerHTML = "";

	SHIP_CATALOG.forEach((ship) => {
		const option = document.createElement("option");
		option.value = ship.id;
		option.textContent = ship.name;
		purchaseShipSelectEl.append(option);
	});
}

function syncPilotFormFromState() {
	if (pilotCallsignInputEl) {
		pilotCallsignInputEl.value = state.pilotProfile.callsign;
	}

	if (pilotOrganizationInputEl) {
		pilotOrganizationInputEl.value = state.pilotProfile.organization;
	}

	if (pilotShipInputEl) {
		pilotShipInputEl.value = state.pilotProfile.primaryShip;
	}

	if (pilotSystemInputEl) {
		pilotSystemInputEl.value = state.pilotProfile.homeSystem;
	}

	if (pilotSpecialtiesInputEl) {
		pilotSpecialtiesInputEl.value = state.pilotProfile.specialties.join(", ");
	}
}

try {
	const savedPilotProfileRaw = localStorage.getItem(PILOT_STORAGE_KEY);
	if (savedPilotProfileRaw) {
		state.pilotProfile = sanitizePilotProfile(JSON.parse(savedPilotProfileRaw), state.pilotProfile);
	}
}
catch {
	state.pilotProfile = sanitizePilotProfile(state.pilotProfile, state.pilotProfile);
}

try {
	const savedShipsRaw = localStorage.getItem(HANGAR_STORAGE_KEY);
	if (savedShipsRaw) {
		state.ownedShips = normalizeOwnedShips(JSON.parse(savedShipsRaw));
	}
	else {
		state.ownedShips = normalizeOwnedShips(state.ownedShips);
	}
}
catch {
	state.ownedShips = normalizeOwnedShips(state.ownedShips);
}

try {
	const savedSessionProfileRaw = localStorage.getItem(SESSION_STORAGE_KEY);
	if (savedSessionProfileRaw) {
		state.sessionProfile = sanitizeSessionProfile(JSON.parse(savedSessionProfileRaw), state.sessionProfile);
	}
}
catch {
	state.sessionProfile = sanitizeSessionProfile(state.sessionProfile, state.sessionProfile);
}

try {
	const savedSessionHistoryRaw = localStorage.getItem(SESSION_HISTORY_STORAGE_KEY);
	if (savedSessionHistoryRaw) {
		state.sessionHistory = sanitizeSessionHistory(JSON.parse(savedSessionHistoryRaw));
	}
}
catch {
	state.sessionHistory = sanitizeSessionHistory(state.sessionHistory);
}

state.selectedSessionId = Array.isArray(state.sessionHistory) && state.sessionHistory.length > 0 ? state.sessionHistory[0].id : null;

renderPilotProfile();
renderSessionProfile();
renderSessionHistory();
renderOwnedShips();

applyTheme(resolvedTheme);

if (state.customThemeActive) {
	state.visualSettings = applyVisualSettings(state.visualSettings);
}
else {
	clearCustomVisualSettings();
}

populateThemeSelector(themeSelectEl, resolvedTheme);

if (themeSelectEl) {
	themeSelectEl.value = state.customThemeActive ? "custom" : resolvedTheme;
}

function updatePendingThemeDescription(themeId) {
	if (!themeDescriptionEl) {
		return;
	}

	if (themeId === "custom") {
		themeDescriptionEl.textContent = "Custom theme colors active. Use Apply Theme to open custom sliders.";
		return;
	}

	themeDescriptionEl.textContent = getThemeDescription(themeId);
}

function updateCustomizeButtonVisibility(themeId) {
	if (!customizeThemeBtnEl) {
		return;
	}

	customizeThemeBtnEl.hidden = themeId !== "custom";
}

updatePendingThemeDescription(pendingThemeSelection);
updateCustomizeButtonVisibility(pendingThemeSelection);

function updateVisualLabels() {
	if (glowValueEl) {
		glowValueEl.textContent = Number(state.visualSettings.glowStrength).toFixed(2);
	}

	if (scanlineValueEl) {
		scanlineValueEl.textContent = Number(state.visualSettings.scanlineStrength).toFixed(2);
	}

	if (accentColorValueEl) {
		accentColorValueEl.textContent = String(state.visualSettings.accentColor).toLowerCase();
	}

	if (backgroundColorValueEl) {
		backgroundColorValueEl.textContent = String(state.visualSettings.backgroundColor).toLowerCase();
	}
}

function syncControlsFromState() {
	if (glowRangeEl) {
		glowRangeEl.value = Number(state.visualSettings.glowStrength).toFixed(2);
	}

	if (scanlineRangeEl) {
		scanlineRangeEl.value = Number(state.visualSettings.scanlineStrength).toFixed(2);
	}

	if (accentColorEl) {
		accentColorEl.value = String(state.visualSettings.accentColor).toLowerCase();
	}

	if (backgroundColorEl) {
		backgroundColorEl.value = String(state.visualSettings.backgroundColor).toLowerCase();
	}

	updateVisualLabels();
}

syncControlsFromState();

function closeThemeDropdown() {
	if (themeDropdownEl) {
		themeDropdownEl.hidden = true;
	}
}

function openThemeDropdown() {
	if (themeDropdownEl) {
		themeDropdownEl.hidden = false;
	}
}

if (gearButtonEl && themeDropdownEl) {
	gearButtonEl.addEventListener("click", () => {
		if (themeDropdownEl.hidden) {
			openThemeDropdown();
			return;
		}

		closeThemeDropdown();
	});
}

document.addEventListener("click", (event) => {
	if (!themeDropdownEl || themeDropdownEl.hidden) {
		return;
	}

	const isInsideDropdown = themeDropdownEl.contains(event.target);
	const isGearButton = gearButtonEl ? gearButtonEl.contains(event.target) : false;

	if (!isInsideDropdown && !isGearButton) {
		closeThemeDropdown();
	}
});

document.addEventListener("keydown", (event) => {
	if (event.key === "Escape") {
		closeThemeDropdown();
	}
});

if (themeSelectEl) {
	themeSelectEl.addEventListener("change", (event) => {
		pendingThemeSelection = event.target.value;
		updatePendingThemeDescription(pendingThemeSelection);
		updateCustomizeButtonVisibility(pendingThemeSelection);
	});
}

if (customizeThemeBtnEl) {
	customizeThemeBtnEl.addEventListener("click", () => {
		if (!settingsDialogEl) {
			return;
		}

		state.customThemeActive = true;
		saveCustomThemeActive(true);
		state.visualSettings = applyVisualSettings(state.visualSettings);
		syncControlsFromState();
		settingsDialogEl.showModal();
		renderAppStatus(state);
	});
}

if (applyThemeBtnEl) {
	applyThemeBtnEl.addEventListener("click", () => {
		const nextTheme = pendingThemeSelection || state.selectedTheme;

		if (nextTheme === "custom") {
			state.customThemeActive = true;
			saveCustomThemeActive(true);
			state.visualSettings = applyVisualSettings(state.visualSettings);
			syncControlsFromState();
			updateCustomizeButtonVisibility(nextTheme);
			closeThemeDropdown();
			if (settingsDialogEl) {
				settingsDialogEl.showModal();
			}
			renderAppStatus(state);
			return;
		}

		state.customThemeActive = false;
		state.selectedTheme = nextTheme;
		saveCustomThemeActive(false);
		applyTheme(nextTheme);
		clearCustomVisualSettings();
		saveThemeId(nextTheme);
		updateCustomizeButtonVisibility(nextTheme);
		closeThemeDropdown();
		renderAppStatus(state);
	});
}

if (glowRangeEl) {
	glowRangeEl.addEventListener("input", () => {
		state.visualSettings.glowStrength = Number(glowRangeEl.value);
		if (state.customThemeActive) {
			state.visualSettings = applyVisualSettings(state.visualSettings);
		}
		saveVisualSettings(state.visualSettings);
		updateVisualLabels();
	});
}

if (scanlineRangeEl) {
	scanlineRangeEl.addEventListener("input", () => {
		state.visualSettings.scanlineStrength = Number(scanlineRangeEl.value);
		if (state.customThemeActive) {
			state.visualSettings = applyVisualSettings(state.visualSettings);
		}
		saveVisualSettings(state.visualSettings);
		updateVisualLabels();
	});
}

if (accentColorEl) {
	accentColorEl.addEventListener("input", () => {
		state.visualSettings.accentColor = accentColorEl.value;
		if (state.customThemeActive) {
			state.visualSettings = applyVisualSettings(state.visualSettings);
		}
		saveVisualSettings(state.visualSettings);
		updateVisualLabels();
	});
}

if (backgroundColorEl) {
	backgroundColorEl.addEventListener("input", () => {
		state.visualSettings.backgroundColor = backgroundColorEl.value;
		if (state.customThemeActive) {
			state.visualSettings = applyVisualSettings(state.visualSettings);
		}
		saveVisualSettings(state.visualSettings);
		updateVisualLabels();
	});
}

if (resetSettingsBtnEl) {
	resetSettingsBtnEl.addEventListener("click", () => {
		state.visualSettings = getDefaultVisualSettings();
		if (state.customThemeActive) {
			state.visualSettings = applyVisualSettings(state.visualSettings);
		}
		saveVisualSettings(state.visualSettings);
		syncControlsFromState();
	});
}

if (editPilotBtnEl && pilotSettingsDialogEl) {
	editPilotBtnEl.addEventListener("click", () => {
		syncPilotFormFromState();
		pilotSettingsDialogEl.showModal();
	});
}

if (cancelPilotSettingsBtnEl && pilotSettingsDialogEl) {
	cancelPilotSettingsBtnEl.addEventListener("click", () => {
		pilotSettingsDialogEl.close();
	});
}

if (pilotSettingsFormEl && pilotSettingsDialogEl) {
	pilotSettingsFormEl.addEventListener("submit", (event) => {
		event.preventDefault();

		const updatedProfile = sanitizePilotProfile(
			{
				callsign: pilotCallsignInputEl ? pilotCallsignInputEl.value : state.pilotProfile.callsign,
				organization: pilotOrganizationInputEl ? pilotOrganizationInputEl.value : state.pilotProfile.organization,
				primaryShip: pilotShipInputEl ? pilotShipInputEl.value : state.pilotProfile.primaryShip,
				homeSystem: pilotSystemInputEl ? pilotSystemInputEl.value : state.pilotProfile.homeSystem,
				specialties: pilotSpecialtiesInputEl ? pilotSpecialtiesInputEl.value : state.pilotProfile.specialties
			},
			state.pilotProfile
		);

		state.pilotProfile = updatedProfile;
		localStorage.setItem(PILOT_STORAGE_KEY, JSON.stringify(updatedProfile));
		renderPilotProfile();
		pilotSettingsDialogEl.close();
	});
}

if (editSessionBtnEl && sessionSettingsDialogEl) {
	editSessionBtnEl.addEventListener("click", () => {
		syncSessionFormFromState();
		sessionSettingsDialogEl.showModal();
	});
}

if (cancelSessionSettingsBtnEl && sessionSettingsDialogEl) {
	cancelSessionSettingsBtnEl.addEventListener("click", () => {
		sessionSettingsDialogEl.close();
	});
}

if (sessionSettingsFormEl && sessionSettingsDialogEl) {
	sessionSettingsFormEl.addEventListener("submit", (event) => {
		event.preventDefault();

			const parsedIncomeCategories = parseFinancialCategoriesFromInput(sessionIncomeInputEl ? sessionIncomeInputEl.value : "", "Income");
			const parsedCostCategories = parseFinancialCategoriesFromInput(sessionCostInputEl ? sessionCostInputEl.value : "", "Cost");

		state.sessionProfile = sanitizeSessionProfile(
			{
				status: sessionStatusInputEl ? sessionStatusInputEl.value : state.sessionProfile.status,
				focus: sessionFocusInputEl ? sessionFocusInputEl.value : state.sessionProfile.focus,
				route: sessionRouteInputEl ? sessionRouteInputEl.value : state.sessionProfile.route,
				notes: sessionNotesInputEl ? sessionNotesInputEl.value : state.sessionProfile.notes,
					incomeCategories: parsedIncomeCategories,
					costCategories: parsedCostCategories,
				lastUpdated: new Date().toLocaleString()
			},
			state.sessionProfile
		);

		const activeEntry = state.sessionHistory.find((entry) => entry.id === state.selectedSessionId);
			if (activeEntry) {
				activeEntry.title = state.sessionProfile.focus || "Session";
				activeEntry.status = state.sessionProfile.status;
				activeEntry.focus = state.sessionProfile.focus;
				activeEntry.route = state.sessionProfile.route;
				activeEntry.summary = state.sessionProfile.notes;
				activeEntry.incomeCategories = [...state.sessionProfile.incomeCategories];
				activeEntry.costCategories = [...state.sessionProfile.costCategories];
				activeEntry.updatedAt = state.sessionProfile.lastUpdated;

				const activeFinance = getSessionFinancialSummary(activeEntry);
				activeEntry.payout = formatAuec(activeFinance.netTotal);
			}
			else {
				const incomeCategories = [...state.sessionProfile.incomeCategories];
				const costCategories = [...state.sessionProfile.costCategories];
				const finance = getSessionFinancialSummary({ incomeCategories, costCategories });

			state.sessionHistory.unshift({
				id: `session-${Date.now()}`,
				title: state.sessionProfile.focus || "New Session",
				status: state.sessionProfile.status,
				focus: state.sessionProfile.focus,
				route: state.sessionProfile.route,
				summary: state.sessionProfile.notes,
					duration: "—",
					payout: formatAuec(finance.netTotal),
					incomeCategories,
					costCategories,
				updatedAt: state.sessionProfile.lastUpdated
			});

				state.selectedSessionId = state.sessionHistory[0].id;
		}

		persistSessionProfile();
		renderSessionProfile();
		renderSessionHistory();
		persistSessionHistory();
		sessionSettingsDialogEl.close();
	});
}

if (sessionHistoryOpenEl) {
	sessionHistoryOpenEl.addEventListener("click", (event) => {
		const target = event.target;
		if (!(target instanceof HTMLElement)) {
			return;
		}

		const actionButton = target.closest(".session-history-action");
		if (actionButton) {
			updateSessionHistoryEntry(actionButton.dataset.entryId, actionButton.dataset.nextStatus);
			return;
		}

		const entryButton = target.closest(".session-history-card");
		if (entryButton) {
			selectSessionHistoryEntry(entryButton.dataset.entryId);
		}
	});
}

if (sessionHistoryClosedEl) {
	sessionHistoryClosedEl.addEventListener("click", (event) => {
		const target = event.target;
		if (!(target instanceof HTMLElement)) {
			return;
		}

		const actionButton = target.closest(".session-history-action");
		if (actionButton) {
			updateSessionHistoryEntry(actionButton.dataset.entryId, actionButton.dataset.nextStatus);
			return;
		}

		const entryButton = target.closest(".session-history-card");
		if (entryButton) {
			selectSessionHistoryEntry(entryButton.dataset.entryId);
		}
	});
}

if (sessionHistoryFailedEl) {
	sessionHistoryFailedEl.addEventListener("click", (event) => {
		const target = event.target;
		if (!(target instanceof HTMLElement)) {
			return;
		}

		const actionButton = target.closest(".session-history-action");
		if (actionButton) {
			updateSessionHistoryEntry(actionButton.dataset.entryId, actionButton.dataset.nextStatus);
			return;
		}

		const entryButton = target.closest(".session-history-card");
		if (entryButton) {
			selectSessionHistoryEntry(entryButton.dataset.entryId);
		}
	});
}

if (editHangarBtnEl && hangarSettingsDialogEl) {
	editHangarBtnEl.addEventListener("click", () => {
		renderHangarEditorShips();
		hangarSettingsDialogEl.showModal();
	});
}

if (cancelHangarSettingsBtnEl && hangarSettingsDialogEl) {
	cancelHangarSettingsBtnEl.addEventListener("click", () => {
		hangarSettingsDialogEl.close();
	});
}

if (closeHangarSettingsBtnEl && hangarSettingsDialogEl) {
	closeHangarSettingsBtnEl.addEventListener("click", () => {
		hangarSettingsDialogEl.close();
	});
}

if (hangarSettingsFormEl && hangarSettingsDialogEl) {
	hangarSettingsFormEl.addEventListener("submit", (event) => {
		event.preventDefault();
	});
}

if (hangarShipsListEl) {
	hangarShipsListEl.addEventListener("click", (event) => {
		const target = event.target;
		if (!(target instanceof Element)) {
			return;
		}

		const removeBtn = target.closest(".remove-ship-btn");
		if (!removeBtn) {
			return;
		}

		const index = Number(removeBtn.dataset.shipIndex);
		if (!Number.isInteger(index) || index < 0 || index >= state.ownedShips.length) {
			return;
		}

		state.ownedShips.splice(index, 1);
		persistOwnedShips();
		renderOwnedShips();
		renderHangarEditorShips();
	});
}

if (openPurchaseShipBtnEl && purchaseShipDialogEl) {
	openPurchaseShipBtnEl.addEventListener("click", () => {
		syncPurchaseShipOptions();
		if (purchaseShipHelpEl) {
			purchaseShipHelpEl.textContent = "Choose a ship, then click Purchase.";
		}
		purchaseShipDialogEl.showModal();
	});
}

if (cancelPurchaseShipBtnEl && purchaseShipDialogEl) {
	cancelPurchaseShipBtnEl.addEventListener("click", () => {
		purchaseShipDialogEl.close();
	});
}

if (purchaseShipFormEl && purchaseShipDialogEl) {
	purchaseShipFormEl.addEventListener("submit", (event) => {
		event.preventDefault();
		if (!purchaseShipSelectEl) {
			return;
		}

		const selectedShipId = purchaseShipSelectEl.value;
		const ship = SHIP_CATALOG.find((entry) => entry.id === selectedShipId);
		if (!ship) {
			return;
		}

		const alreadyOwned = state.ownedShips.some((owned) => owned.id === ship.id);
		if (alreadyOwned) {
			if (purchaseShipHelpEl) {
				purchaseShipHelpEl.textContent = `${ship.name} is already in your hangar.`;
			}
			return;
		}

		state.ownedShips.push({ ...ship });
		persistOwnedShips();
		renderOwnedShips();
		renderHangarEditorShips();
		purchaseShipDialogEl.close();
	});
}

renderAppStatus(state);
