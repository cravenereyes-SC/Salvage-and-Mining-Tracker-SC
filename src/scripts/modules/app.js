import { getThemeByIdOrDefault, getThemeDescription, manufacturerThemes } from "./themes.js";

export function renderAppStatus(state) {
  const appStatusEl = document.querySelector("#app-status");
  const buildInfoEl = document.querySelector("#build-info");
  const themeDescriptionEl = document.querySelector("#theme-description");

  if (!appStatusEl || !buildInfoEl || !themeDescriptionEl) {
    return;
  }

  const selectedTheme = getThemeByIdOrDefault(state.selectedTheme, state.defaultTheme);
  const selectedThemeName = state.customThemeActive
    ? `Custom (${selectedTheme.name})`
    : (selectedTheme ? selectedTheme.name : "Unknown");

  appStatusEl.textContent = `${state.status} Active theme: ${selectedThemeName}.`;
  themeDescriptionEl.textContent = state.customThemeActive
    ? "Custom theme colors active. Pick a manufacturer to return to preset palettes."
    : getThemeDescription(state.selectedTheme);
  buildInfoEl.textContent = `${state.appName} | ${selectedThemeName} HUD | ${state.loadedAt.toLocaleString()}`;
}
