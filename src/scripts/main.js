import { createInitialState } from "./modules/state.js";
import { renderAppStatus } from "./modules/app.js";
import {
	applyTheme,
	applyVisualSettings,
	getDefaultVisualSettings,
	getSavedThemeId,
	getSavedVisualSettings,
	populateThemeSelector,
	saveThemeId,
	saveVisualSettings
} from "./modules/themes.js";

const state = createInitialState();

const themeSelectEl = document.querySelector("#theme-select");
const settingsDialogEl = document.querySelector("#settings-dialog");
const openSettingsBtnEl = document.querySelector("#open-settings");
const resetSettingsBtnEl = document.querySelector("#reset-settings");
const glowRangeEl = document.querySelector("#glow-strength");
const scanlineRangeEl = document.querySelector("#scanline-strength");
const glowValueEl = document.querySelector("#glow-strength-value");
const scanlineValueEl = document.querySelector("#scanline-strength-value");

const resolvedTheme = getSavedThemeId(state.defaultTheme);
const savedVisualSettings = getSavedVisualSettings();

state.selectedTheme = resolvedTheme;
state.visualSettings = applyVisualSettings(savedVisualSettings);

applyTheme(resolvedTheme);
populateThemeSelector(themeSelectEl, resolvedTheme);

function updateVisualLabels() {
	if (glowValueEl) {
		glowValueEl.textContent = Number(state.visualSettings.glowStrength).toFixed(2);
	}

	if (scanlineValueEl) {
		scanlineValueEl.textContent = Number(state.visualSettings.scanlineStrength).toFixed(2);
	}
}

function syncControlsFromState() {
	if (glowRangeEl) {
		glowRangeEl.value = Number(state.visualSettings.glowStrength).toFixed(2);
	}

	if (scanlineRangeEl) {
		scanlineRangeEl.value = Number(state.visualSettings.scanlineStrength).toFixed(2);
	}

	updateVisualLabels();
}

syncControlsFromState();

if (themeSelectEl) {
	themeSelectEl.addEventListener("change", (event) => {
		const nextTheme = event.target.value;
		state.selectedTheme = nextTheme;
		applyTheme(nextTheme);
		saveThemeId(nextTheme);
		renderAppStatus(state);
	});
}

if (openSettingsBtnEl && settingsDialogEl) {
	openSettingsBtnEl.addEventListener("click", () => {
		syncControlsFromState();
		settingsDialogEl.showModal();
	});
}

if (glowRangeEl) {
	glowRangeEl.addEventListener("input", () => {
		state.visualSettings.glowStrength = Number(glowRangeEl.value);
		state.visualSettings = applyVisualSettings(state.visualSettings);
		saveVisualSettings(state.visualSettings);
		updateVisualLabels();
	});
}

if (scanlineRangeEl) {
	scanlineRangeEl.addEventListener("input", () => {
		state.visualSettings.scanlineStrength = Number(scanlineRangeEl.value);
		state.visualSettings = applyVisualSettings(state.visualSettings);
		saveVisualSettings(state.visualSettings);
		updateVisualLabels();
	});
}

if (resetSettingsBtnEl) {
	resetSettingsBtnEl.addEventListener("click", () => {
		state.visualSettings = applyVisualSettings(getDefaultVisualSettings());
		saveVisualSettings(state.visualSettings);
		syncControlsFromState();
	});
}

renderAppStatus(state);
