import * as THREE from 'three';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';
import { gsap } from 'gsap';

import { canvasName } from './config';
import { objects, cameras } from './spice';
import * as ctrl from './controls';

let canvas;
let scene;
let currentCamera;
let currentCameraId;
let defaultCamera;
let cameraControls;
let renderer;
let textureLoader;
let objLoader;
let gltfLoader;
let loadingManager;

let maxProgress = 0;

function init() {
    canvas = document.getElementById(canvasName);
    scene = new THREE.Scene();
    
    defaultCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1E-6, 1E12);
    cameras.get(0).camera = defaultCamera;
    // const aspect = window.innerWidth / window.innerHeight; const frustumSize = 1000; defaultCamera = new THREE.OrthographicCamera(-frustumSize * aspect / 2, frustumSize * aspect / 2, frustumSize / 2, -frustumSize / 2, 0.01, 5000000000);
    defaultCamera.position.set(0, 0, 1000); // Set an initial position for the defaultCamera
    
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, logarithmicDepthBuffer: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    cameraControls = new TrackballControls(defaultCamera, renderer.domElement);
    cameraControls.enableDamping = true;
    cameraControls.dampingFactor = 0.03;
    cameraControls.enableZoom = true;
    
    const progressBarContainer = document.querySelector('.progress-bar-container');
    const progressBar = document.getElementById('progress-bar');
    const threeCanvas = document.getElementById('three-canvas');
    const uiElements = document.getElementById('ui-elements');

    loadingManager = new THREE.LoadingManager();

    loadingManager.onStart = function (url, itemsLoaded, itemsTotal) {
    };
    
    loadingManager.onProgress = function (item, loaded, total) {
        const progress = (loaded / total) * 110;
        if(maxProgress < progress) maxProgress = progress;
        const bar = maxProgress < 100 ? String(maxProgress) : String(100);
        progressBar.style.width = bar + '%';
        console.log(item);
    };

    loadingManager.onLoad = function () {
        progressBarContainer.style.display = 'none';
    };

    textureLoader = new THREE.TextureLoader(loadingManager);
    gltfLoader = new GLTFLoader(loadingManager);
    objLoader = new OBJLoader(loadingManager);

    window.addEventListener('resize', () => {
        resizeCameraAspect();
        resizeCameraBox();
    });
}

function resizeCameraAspect() {
    const canvas = document.querySelector('canvas');
    
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    canvas.width = windowWidth;
    canvas.height = windowHeight;
    
    renderer.setSize(windowWidth, windowHeight);
    
    currentCamera.aspect = windowWidth / windowHeight;
    currentCamera.updateProjectionMatrix();
}

function resizeCameraBox() {
    const box = document.getElementById('camera-box');
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    if(currentCamera != defaultCamera) box.style.display = 'block';
    else box.style.display = 'none';
    
    let width, height;
    const margin = 6;

    // Screen is wider than camera aspect → pillarbox
    if (windowWidth / windowHeight > cameras.get(currentCameraId).aspect) {
        height = windowHeight - margin;
        width = windowHeight * cameras.get(currentCameraId).aspect - margin;
    }
    // Screen is taller than camera aspect → letterbox  
    else {
        width = windowWidth - margin;
        height = windowWidth / cameras.get(currentCameraId).aspect - margin;
    }

    box.style.width = `${width}px`;
    box.style.height = `${height}px`;
}

export function changeCamera(cameraId) {
    if(cameraId === 0) {
        currentCameraId = 0;
        currentCamera = defaultCamera;
    }
    else {
        currentCameraId = cameraId;
        currentCamera = cameras.get(cameraId).camera;
        resizeCameraAspect();
        resizeCameraBox();
    }
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
            loadModel(gltfLoader, '/models/hera/hera_deployed.glb'),
            loadModel(gltfLoader, '/models/juventas/juventas_deployed.glb'),
            loadModel(gltfLoader, '/models/milani/milani_deployed.glb')
        ];
        const [tmpPhobos, tmpDeimos, tmpDidymos, tmpDimorphos, tmpHera, tmpJuventas, tmpMilani] = await Promise.all(promises);
        
        tmpPhobos.scene.scale.set(1, 1, 1);
        phobosModel = tmpPhobos.scene;
        
        tmpDeimos.scene.scale.set(1, 1, 1);
        deimosModel = tmpDeimos.scene;

        didymosModel = tmpDidymos;
        dimorphosModel = tmpDimorphos;

        tmpHera.scene.scale.setScalar(0.001);
        tmpHera.scene.rotateX(Math.PI / 2);
        heraModel = tmpHera.scene;
        
        tmpJuventas.scene.scale.setScalar(0.001);
        juventasModel = tmpJuventas.scene;

        tmpMilani.scene.scale.setScalar(0.001);
        milaniModel = tmpMilani.scene;

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

const scMaterials = [
    new THREE.MeshStandardMaterial({ color: 0xcccccc, emissive: 0xffffff, emissiveIntensity: 2 }), // +X (right) — green
    new THREE.MeshStandardMaterial({ color: 0xcccccc, emissive: 0xffffff, emissiveIntensity: 2 }), // -X (left)  — red
    new THREE.MeshStandardMaterial({ color: 0xcccccc, emissive: 0xffffff, emissiveIntensity: 2 }), // +Y (top)   — white
    new THREE.MeshStandardMaterial({ color: 0xcccccc, emissive: 0xffffff, emissiveIntensity: 2 }), // -Y (bottom)— dark gray
    new THREE.MeshStandardMaterial({ color: 0xcccccc, emissive: 0xffffff, emissiveIntensity: 2 }), // +Z (front) — blue
    new THREE.MeshStandardMaterial({ color: 0xcccccc, emissive: 0xffffff, emissiveIntensity: 2 })  // -Z (back)  — orange
  ];
  

function loadMaterials() {
    starFieldMaterial = new THREE.MeshBasicMaterial({
        map: starFieldTexture,
        side: THREE.BackSide,
        color: new THREE.Color(0x555555)
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
    starFieldGeometry = new THREE.SphereGeometry(1E25, 300, 300);

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

    objects.get(-91000).group = new THREE.Group();
    heraModel.rotateY(Math.PI);
    objects.get(-91000).group.add(heraModel);

    objects.get(-15513000).group = new THREE.Group();
    objects.get(-15513000).group.add(juventasModel);

    objects.get(-9102000).group = new THREE.Group();
    objects.get(-9102000).group.add(milaniModel);
}

export function loadScene() {

    // STARFIELD
    objects.get(0).group.position.set(0, 0, 0);
    scene.add(objects.get(0).group);

    // SUN
    objects.get(10).group.position.set(10000000, 0, 0);
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

    // HERA
    objects.get(-91000).group.position.set(150000, 0, 249.750-20000);
    scene.add(objects.get(-91000).group);

    // JUVENTAS
    objects.get(-15513000).group.position.set(150000+0.005, 0, 249.750-20000);
    scene.add(objects.get(-15513000).group);

    // MILANI
    objects.get(-9102000).group.position.set(150000-0.005, 0.001, 249.750-20000);
    scene.add(objects.get(-9102000).group);
}

export async function loadThreeJSEngine() {
    init();
    loadTextures();
    loadMaterials();
    loadGeometry();
    loadSurfaces();
    await loadModels();
    loadObjects();
    loadScene();
    currentCamera = defaultCamera;
    const axisHelper = new THREE.AxesHelper(1E6);
    scene.add(axisHelper);
    animate();
}

export function getCameraId(cameraName) {
    for (let [id, name] of cameras) {
        if (name === cameraName) return id;
    }
    return -91000;  // Default Hera
}



let lastObjectId = -91000;  // Default Hera

export function gsapCameraTo() {
    objects.get(lastObjectId).group.visible = true;
    lastObjectId = ctrl.observerId;
    const object = objects.get(ctrl.observerId);

    cameraControls.enabled = false;
    cameraControls.target = object.group.position;
    cameraControls.minDistance = object.cameraRadius * 1.05;
    cameraControls.maxDistance = object.cameraRadius * 500;
    cameraControls.update();

    let distance;
    let direction;

    if(ctrl.firstPersonView && !ctrl.simulationRunning) {
        if(object.group.visible) object.group.visible = false;
        distance = object.cameraRadius / 100;
        direction = defaultCamera.position.clone().sub(object.group.position).normalize();
    }
    else {
        if(!object.group.visible) object.group.visible = true;
        distance = object.cameraRadius * 10;
        direction = defaultCamera.position.clone().sub(object.group.position).normalize();
    }

    const newPosition = object.group.position.clone().add(direction.multiplyScalar(distance));

    gsap.to(defaultCamera.position,
    {
        x: newPosition.x,
        y: newPosition.y,
        z: newPosition.z,
        duration: 0.5,
        onUpdate: function () {
            defaultCamera.lookAt(object.group.position);
            cameraControls.update();
        }
    });

    cameraControls.enabled = true;
    cameraControls.update();
}

export function gsapCameraFPV() {
    const object = objects.get(ctrl.observerId);

    cameraControls.enabled = false;
    cameraControls.update();

    let distance;
    let direction;

    if (ctrl.firstPersonView) {
        if(object.group.visible) object.group.visible = false;
        distance = object.cameraRadius / 100;
        direction = defaultCamera.position.clone().sub(object.group.position).normalize();
        cameraControls.minDistance = distance;
        cameraControls.maxDistance = distance;
        cameraControls.enableZoom = false;
    } else {
        if(!object.group.visible) object.group.visible = true;
        distance = object.cameraRadius * 10;
        direction = defaultCamera.position.clone().sub(object.group.position).normalize();
        cameraControls.minDistance = object.cameraRadius * 1.05;
        cameraControls.maxDistance = object.cameraRadius * 500;
        cameraControls.enableZoom = true;
        show(ctrl.observerId);
    }

    const newPosition = object.group.position.clone().add(direction.multiplyScalar(distance));

    gsap.to(defaultCamera.position, {
        x: newPosition.x,
        y: newPosition.y,
        z: newPosition.z,
        duration: 0.25,
        onUpdate: () => {
            cameraControls.update();
        },
        onComplete: () => {
            cameraControls.enabled = true; // Re-enable user control
            if(ctrl.firstPersonView) {
                cameraControls.enableZoom = false;
                hide(ctrl.observerId);
                if(ctrl.observerId != lastObjectId) {
                    objects.get(lastObjectId).group.visible = true;
                    lastObjectId = ctrl.observerId;
                }
            }
        }
    });
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
    if(ctrl.simulationRunning) {
        const pos = objects.get(199).group.position;
        pos.x += 100 * ctrl.speedValues[ctrl.speedLevel];
        const vec = defaultCamera.position.clone();
        objects.get(199).group.position.copy(pos);
    }
    cameraControls.update();
    renderer.render(scene, currentCamera);
}