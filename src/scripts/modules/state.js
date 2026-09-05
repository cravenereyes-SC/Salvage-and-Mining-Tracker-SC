export function createInitialState() {
  return {
    appName: "Star Citizen Mining and Salvage Tracker",
    version: {
      number: "0.1.0",
      publishedAt: "2026-08-02"
    },
    status: "Skeleton loaded successfully",
    loadedAt: new Date(),
    defaultTheme: "rsi",
    selectedTheme: "rsi",
    customThemeActive: false,
    pilotProfile: {
      callsign: "CPT-AURORA",
      organization: "Independent Contractor",
      primaryShip: "Drake Vulture",
      homeSystem: "Stanton",
      specialties: ["Salvage Ops", "Mining Support", "Cargo Logistics", "Low-Sec Runs"]
    },
    ownedShips: [
      {
        id: "drake-vulture",
        name: "Drake Vulture",
        manufacturer: "Drake Interplanetary",
        role: "Salvage",
        size: "Small"
      },
      {
        id: "misc-prospector",
        name: "MISC Prospector",
        manufacturer: "MISC",
        role: "Mining",
        size: "Small"
      }
    ],
    activeWorkOrders: [
      {
        id: "wo-001",
        name: "Salvage Operation - Wreckage Site",
        location: "Stanton - Lagrange Point",
        timeRemaining: "2h 30m",
        status: "active"
      },
      {
        id: "wo-002",
        name: "Mining Survey",
        location: "Stanton - Omen",
        timeRemaining: "4h 15m",
        status: "active"
      }
    ],
    visualSettings: {
      glowStrength: 0.7,
      scanlineStrength: 0.08
    }
  };
}
