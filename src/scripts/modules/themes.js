const THEME_STORAGE_KEY = "sc-tracker-theme";
const VISUAL_SETTINGS_STORAGE_KEY = "sc-tracker-visual-settings";
const CUSTOM_THEME_ACTIVE_STORAGE_KEY = "sc-tracker-custom-theme-active";

const visualSettingBounds = {
  glowStrength: { min: 0, max: 1 },
  scanlineStrength: { min: 0, max: 0.25 }
};

const defaultVisualSettings = {
  glowStrength: 0.7,
  scanlineStrength: 0.08,
  accentColor: "#56d6ff",
  backgroundColor: "#14293d"
};

function sanitizeHexColor(colorValue) {
  return /^#[0-9a-fA-F]{6}$/.test(colorValue || "")
    ? colorValue.toLowerCase()
    : defaultVisualSettings.accentColor;
}

function hexToRgbString(hexColor) {
  const cleanHex = hexColor.replace("#", "");
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

function hexToRgbObject(hexColor) {
  const cleanHex = hexColor.replace("#", "");
  return {
    r: parseInt(cleanHex.slice(0, 2), 16),
    g: parseInt(cleanHex.slice(2, 4), 16),
    b: parseInt(cleanHex.slice(4, 6), 16)
  };
}

function toHex(value) {
  return value.toString(16).padStart(2, "0");
}

function rgbObjectToHex(rgb) {
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

function mixRgb(baseRgb, targetRgb, amount) {
  const clampedAmount = clamp(amount, 0, 1);
  return {
    r: Math.round(baseRgb.r + (targetRgb.r - baseRgb.r) * clampedAmount),
    g: Math.round(baseRgb.g + (targetRgb.g - baseRgb.g) * clampedAmount),
    b: Math.round(baseRgb.b + (targetRgb.b - baseRgb.b) * clampedAmount)
  };
}

export const manufacturerThemes = [
  {
    id: "rsi",
    name: "RSI",
    description: "Teal tactical telemetry with high contrast scan lines.",
    hudMetrics: [
      { label: "Hull Stress Buffer", value: "3.4%" },
      { label: "Signature Dampening", value: "89%" },
      { label: "Radar Sweep Cycle", value: "1.8s" },
      { label: "Quantum Cal Sync", value: "Stable" }
    ]
  },
  {
    id: "drake",
    name: "Drake Interplanetary",
    description: "Industrial amber HUD with scrappy cockpit energy.",
    hudMetrics: [
      { label: "Scrap Throughput", value: "17.6 SCU/min" },
      { label: "Cooling Loop Delta", value: "+6.1 C" },
      { label: "Power Grid Reserve", value: "31%" },
      { label: "Torque Frame Health", value: "74%" }
    ]
  },
  {
    id: "origin",
    name: "Origin Jumpworks",
    description: "Premium ivory and gold cockpit aesthetic.",
    hudMetrics: [
      { label: "Cabin Pressure Harmony", value: "Nominal" },
      { label: "Fuel Flow Efficiency", value: "96.8%" },
      { label: "Nav Route Confidence", value: "High" },
      { label: "Signature Smoothness", value: "92%" }
    ]
  },
  {
    id: "aegis",
    name: "Aegis Dynamics",
    description: "Navy-toned military instrumentation profile.",
    hudMetrics: [
      { label: "Threat Vector Lock", value: "2 Contacts" },
      { label: "Shield Facet Balance", value: "Front +12" },
      { label: "Missile Rail Ready", value: "4/4" },
      { label: "IFF Integrity", value: "Verified" }
    ]
  },
  {
    id: "anvil",
    name: "Anvil Aerospace",
    description: "Focused blue combat HUD with clear readouts.",
    hudMetrics: [
      { label: "Armor Plate Saturation", value: "22%" },
      { label: "Burst Window", value: "0.9s" },
      { label: "Weapon Drift", value: "0.3 mil" },
      { label: "Target Lead Assist", value: "Enabled" }
    ]
  },
  {
    id: "crusader",
    name: "Crusader Industries",
    description: "Aero cyan dashboard with airy expedition feel.",
    hudMetrics: [
      { label: "Atmos Glide Margin", value: "+14%" },
      { label: "Engine Vector Blend", value: "Smooth" },
      { label: "Cargo Lift Pressure", value: "68%" },
      { label: "Stability Envelope", value: "Wide" }
    ]
  },
  {
    id: "misc",
    name: "MISC",
    description: "Utility green data-forward refinery console.",
    hudMetrics: [
      { label: "Refinery Queue", value: "3 Jobs" },
      { label: "Ore Purity Median", value: "86%" },
      { label: "Cargo Clamp Load", value: "52%" },
      { label: "Scanner Mineral Gain", value: "x1.4" }
    ]
  }
];

function getThemeById(themeId) {
  return manufacturerThemes.find((theme) => theme.id === themeId);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function sanitizeVisualSettings(rawSettings) {
  const glowValue = Number(rawSettings?.glowStrength);
  const scanlineValue = Number(rawSettings?.scanlineStrength);

  return {
    glowStrength: Number.isFinite(glowValue)
      ? clamp(glowValue, visualSettingBounds.glowStrength.min, visualSettingBounds.glowStrength.max)
      : defaultVisualSettings.glowStrength,
    scanlineStrength: Number.isFinite(scanlineValue)
      ? clamp(scanlineValue, visualSettingBounds.scanlineStrength.min, visualSettingBounds.scanlineStrength.max)
      : defaultVisualSettings.scanlineStrength,
    accentColor: sanitizeHexColor(rawSettings?.accentColor),
    backgroundColor: sanitizeHexColor(rawSettings?.backgroundColor)
  };
}

export function getSavedThemeId(defaultThemeId) {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);

  if (saved && getThemeById(saved)) {
    return saved;
  }

  return defaultThemeId;
}

export function getSavedCustomThemeActive() {
  return localStorage.getItem(CUSTOM_THEME_ACTIVE_STORAGE_KEY) === "true";
}

export function saveCustomThemeActive(isActive) {
  localStorage.setItem(CUSTOM_THEME_ACTIVE_STORAGE_KEY, String(Boolean(isActive)));
}

export function getThemeByIdOrDefault(themeId, defaultThemeId) {
  return getThemeById(themeId) || getThemeById(defaultThemeId) || manufacturerThemes[0];
}

export function saveThemeId(themeId) {
  localStorage.setItem(THEME_STORAGE_KEY, themeId);
}

export function applyTheme(themeId) {
  document.body.dataset.theme = themeId;
}

export function getDefaultVisualSettings() {
  return { ...defaultVisualSettings };
}

export function getSavedVisualSettings() {
  try {
    const raw = localStorage.getItem(VISUAL_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return getDefaultVisualSettings();
    }

    return sanitizeVisualSettings(JSON.parse(raw));
  }
  catch {
    return getDefaultVisualSettings();
  }
}

export function saveVisualSettings(settings) {
  const sanitized = sanitizeVisualSettings(settings);
  localStorage.setItem(VISUAL_SETTINGS_STORAGE_KEY, JSON.stringify(sanitized));
}

export function applyVisualSettings(settings) {
  const sanitized = sanitizeVisualSettings(settings);
  const backgroundBaseRgb = hexToRgbObject(sanitized.backgroundColor);
  const bgDeepHex = rgbObjectToHex(mixRgb(backgroundBaseRgb, { r: 0, g: 0, b: 0 }, 0.7));
  const bgMidHex = rgbObjectToHex(mixRgb(backgroundBaseRgb, { r: 0, g: 0, b: 0 }, 0.42));
  const bgHighHex = rgbObjectToHex(mixRgb(backgroundBaseRgb, { r: 255, g: 255, b: 255 }, 0.06));
  const accentRgb = hexToRgbString(sanitized.accentColor);

  document.body.style.setProperty("--glow-strength", sanitized.glowStrength.toFixed(2));
  document.body.style.setProperty("--scanline-strength", sanitized.scanlineStrength.toFixed(2));
  document.body.style.setProperty("--bg-deep", bgDeepHex);
  document.body.style.setProperty("--bg-mid", bgMidHex);
  document.body.style.setProperty("--bg-high", bgHighHex);
  document.body.style.setProperty("--accent", sanitized.accentColor);
  document.body.style.setProperty("--accent-rgb", accentRgb);
  document.body.style.setProperty("--grid-rgb", accentRgb);
  document.body.style.setProperty("--border", `rgb(${accentRgb} / 0.38)`);
  document.body.style.setProperty("--accent-soft", `rgb(${accentRgb} / 0.2)`);

  return sanitized;
}

export function clearCustomVisualSettings() {
  [
    "--glow-strength",
    "--scanline-strength",
    "--bg-deep",
    "--bg-mid",
    "--bg-high",
    "--accent",
    "--accent-rgb",
    "--grid-rgb",
    "--border",
    "--accent-soft"
  ].forEach((name) => {
    document.body.style.removeProperty(name);
  });
}

export function populateThemeSelector(selectEl, selectedThemeId) {
  if (!selectEl) {
    return;
  }

  selectEl.innerHTML = "";

  manufacturerThemes.forEach((theme) => {
    const option = document.createElement("option");
    option.value = theme.id;
    option.textContent = theme.name;
    option.selected = theme.id === selectedThemeId;
    selectEl.append(option);
  });

  const customOption = document.createElement("option");
  customOption.value = "custom";
  customOption.textContent = "Custom";
  customOption.selected = false;
  selectEl.append(customOption);
}

export function getThemeDescription(themeId) {
  const theme = getThemeById(themeId);
  return theme ? theme.description : "Select a manufacturer visual style.";
}
