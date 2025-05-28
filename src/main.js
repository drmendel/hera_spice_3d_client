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
} from './animation';
  
import { openWebSocket } from './websocket';

// ─────────────────────────────────────────────
// Main - Entry Point
// ─────────────────────────────────────────────

openWebSocket().catch(() => {
    simulationRunningStore(false);
    setSimulationTime("2025-03-12T09:27:00.000");
    updatePlaceholder();
});
  
loadThreeJSEngine().then(() => {
    setup();
    gsapCamera();
    animate();
});
