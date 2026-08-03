import { createInitialState } from "./modules/state.js";
import { renderAppStatus } from "./modules/app.js";
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

const state = createInitialState();

const gearButtonEl = document.querySelector("#theme-gear-button");
const themeDropdownEl = document.querySelector("#theme-dropdown");
const themeSelectEl = document.querySelector("#theme-select");
const applyThemeBtnEl = document.querySelector("#apply-theme");
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

const resolvedTheme = getSavedThemeId(state.defaultTheme);
const savedVisualSettings = getSavedVisualSettings();
const savedCustomThemeActive = getSavedCustomThemeActive();

state.selectedTheme = resolvedTheme;
state.customThemeActive = savedCustomThemeActive;
state.visualSettings = savedVisualSettings;

let pendingThemeSelection = state.customThemeActive ? "custom" : state.selectedTheme;

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

updatePendingThemeDescription(pendingThemeSelection);

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

renderAppStatus(state);
