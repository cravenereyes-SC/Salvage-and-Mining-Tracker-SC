# Star Citizen Mining and Salvage Tracker

Clean local web app skeleton to build your browser-based app.

## Folder structure

- index.html: Main app entry point
- public/: Static assets for images/icons/files
- src/styles/: Global and modular styles
- src/scripts/: App logic and modules
- src/components/: Reusable UI snippets/components
- src/pages/: Additional page templates

## Quick start

Option 1: Open index.html directly in your browser.

Option 2: Run a local static server (recommended).

Example with Python:

python -m http.server 5500

Then open:

http://localhost:5500

## One-click launch (tabless app window)

Double-click launch-app.cmd to:

- Start a local server on port 5500 (if not already running)
- Open Microsoft Edge in app window mode without tab bar

Optional: run from terminal with a custom port:

powershell -ExecutionPolicy Bypass -File .\launch-app.ps1 -Port 5600
