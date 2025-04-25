import * as ctrl from './controls';
import * as THREE from 'three';
import * as anim from './animation';
import * as conf from './config';
import * as ws from './websocket';

await ws.openWebSocket();
setInterval(() => {
    ws.requestDataFromServer();
}, 100);

anim.loadThreeJSEngine().then( async () => {
    anim.gsapCameraTo(ctrl.observerId);        // Default to Hera
    anim.animate();
});