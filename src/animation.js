import * as THREE from 'three';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import { canvasName } from './config';
import { objects, cameras } from './spice';
import { firstPersonView } from './controls';

let canvas;
let scene;
let camera;
let cameraControls;
let renderer;
let textureLoader;
let objLoader;
let gltfLoader;

function init() {
    canvas = document.getElementById(canvasName);
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 5000000000);
    // const aspect = window.innerWidth / window.innerHeight; const frustumSize = 1000; camera = new THREE.OrthographicCamera(-frustumSize * aspect / 2, frustumSize * aspect / 2, frustumSize / 2, -frustumSize / 2, 0.01, 5000000000);
    camera.position.set(0, 0, 1000); // Set an initial position for the camera
    
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, logarithmicDepthBuffer: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    cameraControls = new OrbitControls(camera, renderer.domElement);
    cameraControls.enableDamping = true;
    cameraControls.dampingFactor = 0.03;
    cameraControls.enableZoom = true;
    
    textureLoader = new THREE.TextureLoader();
    gltfLoader = new GLTFLoader();
    objLoader = new OBJLoader();

    window.addEventListener('resize', () => {
        const canvas = document.querySelector('canvas');
        const width = window.innerWidth;
        const height = window.innerHeight;
      
        // Update canvas size
        canvas.width = width;
        canvas.height = height;
      
        // Update renderer size
        renderer.setSize(width, height);
      
        // Update camera aspect ratio and projection matrix
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    });  
}

let starFieldTexture;

let sunTexture;
let mercuryTexture;
let venusTexture;
let earthTexture;
let moonTexture;
let marsTexture;
// let phobosTexture;   // not needed, glb already has texture
// let deimosTexture;   // not needed, glb already has texture

let didymosTexture;

function loadTextures() {
    starFieldTexture = textureLoader.load('/images/stars/8k_stars.jpg');

    sunTexture = textureLoader.load('/images/sun/8k_sun.jpg');
    mercuryTexture = textureLoader.load('/images/mercury/2k_mercury.jpg');
    venusTexture = textureLoader.load('/images/venus/2k_venus.jpg');
    
    earthTexture = textureLoader.load('/images/earth/2k_earth_daymap.jpg');
    moonTexture = textureLoader.load('/images/moon/2k_moon.jpg');
    
    marsTexture = textureLoader.load('/images/mars/2k_mars.jpg');
    // phobosTexture = textureLoader.load('/images/phobos/mar1kuu2.jpg');   // not needed, glb already has texture
    // deimosTexture = textureLoader.load('/images/deimos/mar2kuu2.jpg');   // not needed, glb already has texture

    didymosTexture = textureLoader.load('/images/didymos/didymos.jpg');
}

let phobosModel;
let deimosModel;

let didymosModel;
let dimorphosModel;

let heraModel;
let juventasModel;
let milaniModel;

function loadModel(loader, url) {
    return new Promise((resolve, reject) => {
        loader.load(url,
            function(obj) { resolve(obj); },
            undefined,
            reject
        );
    });
}

async function loadModels() {
    try {
        const promises = [
            loadModel(gltfLoader, '/models/phobos/24878_Phobos_1_1000.glb'),
            loadModel(gltfLoader, '/models/deimos/24879_Deimos_1_1000.glb'),
            loadModel(objLoader, '/models/didymos/g_50677mm_rad_obj_didy_0000n00000_v001.obj'),
            loadModel(objLoader, '/models/dimorphos/g_08438mm_lgt_obj_dimo_0000n00000_v002.obj'),
        ];
        const [tmpPhobos, tmpDeimos, tmpDidymos, tmpDimorphos] = await Promise.all(promises);
        
        tmpPhobos.scene.scale.set(1, 1, 1);
        phobosModel = tmpPhobos.scene;
        
        tmpDeimos.scene.scale.set(1, 1, 1);
        deimosModel = tmpDeimos.scene;

        didymosModel = tmpDidymos;
        dimorphosModel = tmpDimorphos;

    } catch (error) {
        console.error('Error loading models:', error);
    }
}

let starFieldMaterial;

let sunMaterial;
let mercuryMaterial;
let venusMaterial;
let earthMaterial;
let moonMaterial;
let marsMaterial;

let didymosMaterial;

function loadMaterials() {
    starFieldMaterial = new THREE.MeshBasicMaterial({
        map: starFieldTexture,
        side: THREE.BackSide,
        color: new THREE.Color(0x555555),
    });

    sunMaterial = new THREE.MeshStandardMaterial({
        map: sunTexture,
        emissive: 0xffffff,           
        emissiveMap: sunTexture,         
        emissiveIntensity: 2
    });
    mercuryMaterial = new THREE.MeshStandardMaterial({ map: mercuryTexture });
    venusMaterial = new THREE.MeshStandardMaterial({ map: venusTexture });
    earthMaterial = new THREE.MeshStandardMaterial({ map: earthTexture });
    moonMaterial = new THREE.MeshStandardMaterial({ map: moonTexture });
    marsMaterial = new THREE.MeshStandardMaterial({ map: marsTexture });

    didymosMaterial = new THREE.MeshStandardMaterial({ map: didymosTexture });
}

let starFieldGeometry;

let sunGeometry;
let mercuryGeometry;
let venusGeometry;
let earthGeometry;
let moonGeometry;
let marsGeometry;

function loadGeometry() {
    starFieldGeometry = new THREE.SphereGeometry(3E25, 300, 300);

    sunGeometry = new THREE.SphereGeometry(696340, 32, 32);
    mercuryGeometry = new THREE.SphereGeometry(2439.7, 32, 32);
    venusGeometry = new THREE.SphereGeometry(6051.8, 32, 32);
    earthGeometry = new THREE.SphereGeometry(6378, 32, 32);
    moonGeometry = new THREE.SphereGeometry(1737.4, 32, 32);
    marsGeometry = new THREE.SphereGeometry(3389.5, 32, 32);
}

let starFieldSurface;
let starFieldLight;

let sunSurface;
let sunLight;

let mercurySurface;
let venusSurface;
let earthSurface;
let moonSurface;
let marsSurface;

function loadSurfaces() {
    starFieldSurface = new THREE.Mesh(starFieldGeometry, starFieldMaterial);
    starFieldLight = new THREE.AmbientLight(0xffffff, 0.015);

    sunSurface = new THREE.Mesh(sunGeometry, sunMaterial);
    sunLight = new THREE.PointLight(0xffffff, 2, 0, 3);
    sunLight.decay = 0;
    sunLight.castShadow = true;
    
    mercurySurface = new THREE.Mesh(mercuryGeometry, mercuryMaterial);
    mercurySurface.castShadow = true;
    mercurySurface.receiveShadow = true;
    
    venusSurface = new THREE.Mesh(venusGeometry, venusMaterial);
    venusSurface.castShadow = true;
    venusSurface.receiveShadow = true;
    
    earthSurface = new THREE.Mesh(earthGeometry, earthMaterial);
    earthSurface.castShadow = true;
    earthSurface.receiveShadow = true;
    
    moonSurface = new THREE.Mesh(moonGeometry, moonMaterial);
    moonSurface.castShadow = true;
    moonSurface.receiveShadow = true;
    
    marsSurface = new THREE.Mesh(marsGeometry, marsMaterial);
    marsSurface.castShadow = true;
    marsSurface.receiveShadow = true;    
}

export function loadObjects() {
    objects.get(0).group = new THREE.Group();
    objects.get(0).group.add(starFieldSurface);
    objects.get(0).group.add(starFieldLight);

    objects.get(10).group = new THREE.Group();
    objects.get(10).group.add(sunSurface);
    objects.get(10).group.add(sunLight);

    objects.get(199).group = new THREE.Group();
    objects.get(199).group.add(mercurySurface);

    objects.get(299).group = new THREE.Group();
    objects.get(299).group.add(venusSurface);

    objects.get(399).group = new THREE.Group();
    objects.get(399).group.add(earthSurface);

    objects.get(301).group = new THREE.Group();
    objects.get(301).group.add(moonSurface);

    objects.get(499).group = new THREE.Group();
    objects.get(499).group.add(marsSurface);

    objects.get(401).group = new THREE.Group();
    objects.get(401).group.add(phobosModel);
    
    objects.get(402).group = new THREE.Group();
    objects.get(402).group.add(deimosModel);

    objects.get(-658030).group = new THREE.Group();
    objects.get(-658030).group.add(didymosModel);

    objects.get(-658031).group = new THREE.Group();
    objects.get(-658031).group.add(dimorphosModel);
}

export function loadScene() {
    /*objects.forEach((value) => {
        scene.add(value.group);
    });*/

    // STARFIELD
    objects.get(0).group.position.set(0, 0, 0);
    scene.add(objects.get(0).group);

    // SUN
    objects.get(10).group.position.set(-10000000, 0, 0);
    scene.add(objects.get(10).group);

    // MERCURY
    objects.get(199).group.position.set(10, 0, 0);
    scene.add(objects.get(199).group);

    // VENUS
    objects.get(299).group.position.set(50000, 0, 0);
    scene.add(objects.get(299).group);

    // EARTH
    objects.get(399).group.position.set(100000, 0, 0);
    scene.add(objects.get(399).group);

    // MOON
    objects.get(301).group.position.set(100000, 0, 20000);
    scene.add(objects.get(301).group);

    // MARS
    objects.get(499).group.position.set(150000, 0, 0);
    scene.add(objects.get(499).group);

    // PHOBOS
    objects.get(401).group.position.set(150000, 0, 20000);
    scene.add(objects.get(401).group);

    // DEIMOS
    objects.get(402).group.position.set(150000, 0, -20000);
    scene.add(objects.get(402).group);

    // DIDYMOS
    objects.get(-658030).group.position.set(150000, 0, 251-20000);
    scene.add(objects.get(-658030).group);

    // DIMORPHOS
    objects.get(-658031).group.position.set(150000, 0, 250-20000);
    scene.add(objects.get(-658031).group);
}

export async function loadThreeJSEngine() {
    init();
    loadTextures();
    loadMaterials();
    loadGeometry();
    loadSurfaces();
    await loadModels();
    loadObjects();
    console.log('objects loaded');
    loadScene();    // hide by default
    hide(0);
    console.log('scene loaded');
    animate();
}

export function getCameraId(cameraName) {
    for (let [id, name] of cameras) {
        if (name === cameraName) return id;
    }
    return -91000;  // Default Hera
}



let lastObjectId = -91000;  // Default Hera

export function setCameraTo(objectId) {
    const obj = objects.get(objectId);
    camera.lookAt(obj.group.position);
    cameraControls.target.copy(obj.group.position);

    let distance;
    let direction;
    if(firstPersonView) {
        distance = obj.cameraRadius / 1000;
        direction = camera.position.clone().sub(obj.group.position).normalize();
    }
    else if(!firstPersonView) {
        distance = obj.cameraRadius * 10;
        direction = camera.position.clone().sub(obj.group.position).normalize();
    }

    camera.position.copy(obj.group.position).add(direction.multiplyScalar(distance));
    cameraControls.update();
    lastObjectId = objectId;
}

export function loadCameraView() {
    const T = cameraControls.target;
    const C = camera.position;
    let nextPosition;
    const obj = objects.get(lastObjectId);
    if(firstPersonView) {
        obj.group.visible = false;
        nextPosition = C.sub(T).normalize().multiplyScalar(obj.cameraRadius/1000).add(T);
        cameraControls.enableZoom = false;
    } else if (!firstPersonView){
        obj.group.visible = true;
        nextPosition = C.sub(T).normalize().multiplyScalar(obj.cameraRadius * 10).add(T);
        cameraControls.enableZoom = true;
        console.log('back');
    }
    camera.position.copy(nextPosition);
    cameraControls.update();
}

export function cameraSetTo(cameraId) {
    switch (cameraId) {
        case -91500:
            break;
        case -91400:
            break;
        case -91120:
            break;
        case -91110:
            break;
        case -15513310:
            break;
        case -91002310:
            break;
        default:
            console.log('Camera not found!');
            break;
    }
}

export function hide(id) {
    objects.get(id).group.visible = false;
}

export function show(id) {
    objects.get(id).group.visible = true;
}

export function animate() {
    requestAnimationFrame(animate);
    cameraControls.update();
    renderer.render(scene, camera);
}
