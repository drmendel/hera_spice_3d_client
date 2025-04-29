import * as ctrl from './controls';
import * as THREE from 'three';
import * as anim from './animation';
import * as conf from './config';
import * as ws from './websocket';

ws.waitForOpen().then(() => {
    ctrl.setParamsFromURL();
});

anim.loadThreeJSEngine().then(() => {
    ctrl.setup();
    anim.gsapCamera();
    anim.animate();
}).then(
    ws.openWebSocket().catch(async () => {
        ctrl.simulationRunningStore(false);
        ctrl.setSimulationTime(String("2025-03-12T09:27:00.000"));
        ctrl.updatePlaceholder();
    }
));
