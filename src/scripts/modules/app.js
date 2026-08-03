import { getThemeByIdOrDefault, getThemeDescription, manufacturerThemes } from "./themes.js";

export function renderAppStatus(state) {
  const appStatusEl = document.querySelector("#app-status");
  const buildInfoEl = document.querySelector("#build-info");
  const themeDescriptionEl = document.querySelector("#theme-description");
  const hudKickerEls = [
    document.querySelector("#hud-kicker-1"),
    document.querySelector("#hud-kicker-2"),
    document.querySelector("#hud-kicker-3"),
    document.querySelector("#hud-kicker-4")
  ];
  const hudValueEls = [
    document.querySelector("#hud-value-1"),
    document.querySelector("#hud-value-2"),
    document.querySelector("#hud-value-3"),
    document.querySelector("#hud-value-4")
  ];

  if (!appStatusEl || !buildInfoEl || !themeDescriptionEl || hudKickerEls.includes(null) || hudValueEls.includes(null)) {
    return;
  }

  const selectedTheme = getThemeByIdOrDefault(state.selectedTheme, state.defaultTheme);
  const selectedThemeName = selectedTheme ? selectedTheme.name : "Unknown";

  appStatusEl.textContent = `${state.status} Active theme: ${selectedThemeName}.`;
  themeDescriptionEl.textContent = getThemeDescription(state.selectedTheme);
  buildInfoEl.textContent = `${state.appName} | ${selectedThemeName} HUD | ${state.loadedAt.toLocaleString()}`;

  selectedTheme.hudMetrics.forEach((metric, index) => {
    hudKickerEls[index].textContent = metric.label;
    hudValueEls[index].textContent = metric.value;
  });
}
