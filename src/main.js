import * as ctrl from './controls';
import * as THREE from 'three';
import * as anim from './animation';
import * as conf from './config';

anim.loadThreeJSEngine().then( async () => {
    anim.setCameraTo(-658031);
    anim.animate();
});