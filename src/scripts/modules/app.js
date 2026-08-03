export function renderAppStatus(state) {
  const appStatusEl = document.querySelector("#app-status");
  const buildInfoEl = document.querySelector("#build-info");

  if (!appStatusEl || !buildInfoEl) {
    return;
  }

  appStatusEl.textContent = state.status;
  buildInfoEl.textContent = `${state.appName} - ${state.loadedAt.toLocaleString()}`;
}
