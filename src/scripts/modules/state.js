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
    sessionProfile: {
      status: "Open",
      focus: "Salvage Ops",
      route: "Stanton - Lagrange",
      notes: "Refuel, verify cargo, and check the latest salvage intel.",
      incomeCategories: [
        { label: "Salvage Sale", amount: 8600 }
      ],
      costCategories: [
        { label: "Fuel", amount: 900 }
      ],
      lastUpdated: "2026-08-03"
    },
    sessionHistory: [
      {
        id: "open-01",
        title: "Active Patrol",
        status: "Open",
        focus: "Salvage Ops",
        route: "Stanton - Lagrange",
        summary: "Scanning for salvage targets and preparing a cargo drop.",
        duration: "2h 40m",
        payout: "8,600 aUEC",
        incomeCategories: [
          { label: "Salvage Sale", amount: 8600 }
        ],
        costCategories: [
          { label: "Fuel", amount: 900 }
        ],
        updatedAt: "2026-08-03"
      },
      {
        id: "closed-01",
        title: "Mining Support Run",
        status: "Closed",
        focus: "Mining Support",
        route: "Stanton - Omen",
        summary: "Completed ore extraction and returned to station safely.",
        duration: "4h 15m",
        payout: "12,300 aUEC",
        incomeCategories: [
          { label: "Ore Sale", amount: 12300 }
        ],
        costCategories: [
          { label: "Refinery Fees", amount: 2100 },
          { label: "Fuel", amount: 1200 }
        ],
        updatedAt: "2026-08-02"
      },
      {
        id: "failed-01",
        title: "Docking Recovery",
        status: "Failed",
        focus: "Cargo Logistics",
        route: "Stanton - RSI",
        summary: "Cargo transfer was aborted after comms and docking issues.",
        duration: "1h 10m",
        payout: "0 aUEC",
        incomeCategories: [],
        costCategories: [
          { label: "Fuel", amount: 500 },
          { label: "Repair", amount: 700 }
        ],
        updatedAt: "2026-08-01"
      }
    ],
    visualSettings: {
      glowStrength: 0.7,
      scanlineStrength: 0.08
    }
  };
}
