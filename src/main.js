import { setup, simulationRunningStore, setSimulationTime,
         updatePlaceholder, updatePlaybackButton } from './controls';
import { loadThreeJSEngine, gsapCamera, animate } from './animation';
import { defaultDate } from './config';
import { openWebSocket } from './websocket';

// ─────────────────────────────────────────────
// Main Execution
// ─────────────────────────────────────────────

loadThreeJSEngine().then(() => {
    setup();
    gsapCamera();
    animate();
}).then(
    openWebSocket().catch(async () => {
        simulationRunningStore(false);
        setSimulationTime(defaultDate.toISOString());
        updatePlaceholder();
        updatePlaybackButton();
    })
);
