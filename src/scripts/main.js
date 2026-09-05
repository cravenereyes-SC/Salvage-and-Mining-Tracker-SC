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
const openSessionBtnEl = document.querySelector("#open-session-btn");
const workOrdersContainerEl = document.querySelector("#work-orders-container");
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

function renderActiveWorkOrders() {
	if (!workOrdersContainerEl) {
		return;
	}

	workOrdersContainerEl.innerHTML = "";

	if (!Array.isArray(state.activeWorkOrders) || state.activeWorkOrders.length === 0) {
		const emptyMsg = document.createElement("p");
		emptyMsg.className = "work-orders-empty";
		emptyMsg.textContent = "No active work orders";
		workOrdersContainerEl.append(emptyMsg);
		return;
	}

	state.activeWorkOrders.forEach((workOrder) => {
		const item = document.createElement("div");
		item.className = "work-order-item";

		const details = document.createElement("div");
		details.className = "work-order-details";

		const name = document.createElement("p");
		name.className = "work-order-name";
		name.textContent = workOrder.name;

		const location = document.createElement("p");
		location.className = "work-order-location";
		location.textContent = `📍 ${workOrder.location}`;

		const time = document.createElement("p");
		time.className = "work-order-time";
		time.textContent = `⏱ Time Left: ${workOrder.timeRemaining}`;

		details.append(name, location, time);
		item.append(details);
		workOrdersContainerEl.append(item);
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

renderPilotProfile();
renderOwnedShips();
renderActiveWorkOrders();

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

if (openSessionBtnEl) {
	openSessionBtnEl.addEventListener("click", () => {
		window.location.href = "sessions.html";
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
