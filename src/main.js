import {
    simulationRunningStore,
    setSimulationTime,
    updatePlaceholder,
    setup
} from './controls';

import {
    loadThreeJSEngine,
    gsapCamera,
    animate
} from './engine';

import { openWebSocket } from './websocket';



// ─────────────────────────────────────────────
// Main - Entry Point
// ─────────────────────────────────────────────

async function main() {
    try {
        await openWebSocket();
    } catch {
        simulationRunningStore(false);
        setSimulationTime("2025-03-12T09:27:00.000");
        updatePlaceholder();
    }

    await loadThreeJSEngine();
    setup();
    gsapCamera();
    animate();
}

main();