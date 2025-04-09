import * as ctrl from './controls';
import * as THREE from 'three';
import * as anim from './animation';
import * as conf from './config';

anim.loadThreeJSEngine().then( async () => {
    anim.gsapCameraTo();        // Default to Hera
    anim.animate();
});