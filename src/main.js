import * as ctrl from './controls';
import * as THREE from 'three';
import * as anim from './animation';
import * as conf from './config';
import * as ws from './websocket';

ws.openWebSocket().catch(async () => {
    ctrl.simulationRunningStore(false);
    ctrl.setSimulationTime(String("2025-03-12T09:27:00.000"));
    ctrl.updatePlaceholder();
    alert("Server unreachable. Attempting reconnection...");
    ws.wsReconnection();
});

anim.loadThreeJSEngine().then( async () => {
    ctrl.setup();
    anim.gsapCamera();
    anim.animate();
});