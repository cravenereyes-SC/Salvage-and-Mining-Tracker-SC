export function createInitialState() {
  return {
    appName: "Star Citizen Mining and Salvage Tracker",
    status: "Skeleton loaded successfully",
    loadedAt: new Date(),
    defaultTheme: "rsi",
    selectedTheme: "rsi",
    customThemeActive: false,
    visualSettings: {
      glowStrength: 0.7,
      scanlineStrength: 0.08
    }
  };
}
