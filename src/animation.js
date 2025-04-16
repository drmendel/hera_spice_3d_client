import * as THREE from 'three';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
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
let labelRenderer;
let textureLoader;
let gltfLoader;
let loadingManager;

let maxProgress = 0;

function init() {
    canvas = document.getElementById(canvasName);
    scene = new THREE.Scene();
    
    defaultCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1E-6, 1E12);
    defaultCamera.layers.enableAll();
    cameras.get(0).camera = defaultCamera;
    // const aspect = window.innerWidth / window.innerHeight; const frustumSize = 1000; defaultCamera = new THREE.OrthographicCamera(-frustumSize * aspect / 2, frustumSize * aspect / 2, frustumSize / 2, -frustumSize / 2, 0.01, 5000000000);
    defaultCamera.position.set(0, 0, 1000); // Set an initial position for the defaultCamera
    
    currentCamera = defaultCamera;
    currentCameraId = 0;

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, logarithmicDepthBuffer: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    document.body.appendChild(labelRenderer.domElement);

    cameraControls = new TrackballControls(defaultCamera, labelRenderer.domElement);
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
    labelRenderer.setSize(windowWidth, windowHeight);
    
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

function initCameras() {
    setCameraOrientations();
    setCameraLayers();
}

function setCameraOrientations() {
    cameras.get(-91400).camera.rotateX(Math.PI);
    cameras.get(-91120).camera.rotateX(Math.PI);
    cameras.get(-91110).camera.rotateX(Math.PI);
    cameras.get(-15513310).camera.rotateX(Math.PI);
    cameras.get(-9102310).camera.rotateX(Math.PI);
}

function setCameraLayers() {
    cameras.forEach((cameraObject) => {
        cameraObject.camera.layers.enableAll();
        cameraObject.camera.layers.disable(1);
        cameraObject.camera.layers.disable(2);
    });
}

let starFieldTexture;

let sunTexture;
let mercuryTexture;
let venusTexture;
let earthTexture;
let moonTexture;
let marsTexture;

function loadTextures() {
    starFieldTexture = textureLoader.load('/images/stars/8k_stars.jpg');

    sunTexture = textureLoader.load('/images/sun/8k_sun.jpg');
    mercuryTexture = textureLoader.load('/images/mercury/2k_mercury.jpg');
    venusTexture = textureLoader.load('/images/venus/2k_venus.jpg');
    
    earthTexture = textureLoader.load('/images/earth/2k_earth_daymap.jpg');
    moonTexture = textureLoader.load('/images/moon/2k_moon.jpg');
    
    marsTexture = textureLoader.load('/images/mars/2k_mars.jpg');
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
            loadModel(gltfLoader, '/models/deimos/24879_Deimos_1_1000.glb'),    // ok
            loadModel(gltfLoader, '/models/didymos/didymos.glb'),               
            loadModel(gltfLoader, '/models/dimorphos/dimorphos.glb'),
            loadModel(gltfLoader, '/models/hera/hera_deployed.glb'),
            loadModel(gltfLoader, '/models/juventas/juventas_deployed.glb'),
            loadModel(gltfLoader, '/models/milani/milani_deployed.glb')
        ];
        const [tmpPhobos, tmpDeimos, tmpDidymos, tmpDimorphos, tmpHera, tmpJuventas, tmpMilani] = await Promise.all(promises);
        
        tmpPhobos.scene.scale.set(1, 1, 1);
        phobosModel = tmpPhobos.scene;
        console.log(phobosModel);
        tmpDeimos.scene.scale.set(1, 1, 1);
        deimosModel = tmpDeimos.scene;

        didymosModel = tmpDidymos.scene;
        dimorphosModel = tmpDimorphos.scene;

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

let sunLabel;
let mercuryLabel;
let venusLabel;
let earthLabel;
let moonLabel;
let marsLabel;
let phobosLabel;
let deimosLabel;
let didymosLabel;
let dimorphosLabel;
let heraLabel;
let juventasLabel;
let milaniLabel;

export function loadLabels() {
    const distanceRatio = 1.2;

    const sunDiv = document.createElement('div');
    sunDiv.className = 'label';
    sunDiv.textContent = 'Sun';
    sunLabel = new CSS2DObject(sunDiv);
    sunLabel.center.set(0.5, 0.5);
    sunLabel.layers.set(1);
    sunLabel.position.set(
        0,
        Math.SQRT2 * objects.get(10).cameraRadius * distanceRatio,
        Math.SQRT2 * objects.get(10).cameraRadius * distanceRatio
    );

    const mercuryDiv = document.createElement('div');
    mercuryDiv.className = 'label';
    mercuryDiv.textContent = 'Mercury';
    mercuryLabel = new CSS2DObject(mercuryDiv);
    mercuryLabel.layers.set(1);
    mercuryLabel.position.set(
        0,
        Math.SQRT2 * objects.get(199).cameraRadius * distanceRatio,
        Math.SQRT2 * objects.get(199).cameraRadius * distanceRatio
    );

    const venusDiv = document.createElement('div');
    venusDiv.className = 'label';
    venusDiv.textContent = 'Venus';
    venusLabel = new CSS2DObject(venusDiv);
    venusLabel.layers.set(1);
    venusLabel.position.set(
        0,
        Math.SQRT2 * objects.get(299).cameraRadius * distanceRatio,
        Math.SQRT2 * objects.get(299).cameraRadius * distanceRatio
    );

    const earthDiv = document.createElement('div');
    earthDiv.className = 'label';
    earthDiv.textContent = 'Earth';
    earthLabel = new CSS2DObject(earthDiv);
    earthLabel.layers.set(1);
    earthLabel.position.set(
        0,
        Math.SQRT2 * objects.get(399).cameraRadius * distanceRatio,
        Math.SQRT2 * objects.get(399).cameraRadius * distanceRatio
    );

    const moonDiv = document.createElement('div');
    moonDiv.className = 'label';
    moonDiv.textContent = 'Moon';
    moonLabel = new CSS2DObject(moonDiv);
    moonLabel.layers.set(1);
    moonLabel.position.set(
        0,
        Math.SQRT2 * objects.get(301).cameraRadius * distanceRatio,
        Math.SQRT2 * objects.get(301).cameraRadius * distanceRatio
    );

    const marsDiv = document.createElement('div');
    marsDiv.className = 'label';
    marsDiv.textContent = 'Mars';
    marsLabel = new CSS2DObject(marsDiv);
    marsLabel.layers.set(1);
    marsLabel.position.set(
        0,
        Math.SQRT2 * objects.get(499).cameraRadius * distanceRatio,
        Math.SQRT2 * objects.get(499).cameraRadius * distanceRatio
    );

    const phobosDiv = document.createElement('div');
    phobosDiv.className = 'label';
    phobosDiv.textContent = 'Phobos';
    phobosLabel = new CSS2DObject(phobosDiv);
    phobosLabel.layers.set(1);
    phobosLabel.position.set(
        0,
        Math.SQRT2 * objects.get(401).cameraRadius * distanceRatio,
        Math.SQRT2 * objects.get(401).cameraRadius * distanceRatio
    );

    const deimosDiv = document.createElement('div');
    deimosDiv.className = 'label';
    deimosDiv.textContent = 'Deimos';
    deimosLabel = new CSS2DObject(deimosDiv);
    deimosLabel.layers.set(1);
    deimosLabel.position.set(
        0,
        Math.SQRT2 * objects.get(402).cameraRadius * distanceRatio,
        Math.SQRT2 * objects.get(402).cameraRadius * distanceRatio
    );

    const didymosDiv = document.createElement('div');
    didymosDiv.className = 'label';
    didymosDiv.textContent = 'Didymos';
    didymosLabel = new CSS2DObject(didymosDiv);
    didymosLabel.layers.set(1);
    didymosLabel.position.set(
        0,
        Math.SQRT2 * objects.get(-658030).cameraRadius * distanceRatio,
        Math.SQRT2 * objects.get(-658030).cameraRadius * distanceRatio
    );

    const dimorphosDiv = document.createElement('div');
    dimorphosDiv.className = 'label';
    dimorphosDiv.textContent = 'Dimorphos';
    dimorphosLabel = new CSS2DObject(dimorphosDiv);
    dimorphosLabel.layers.set(1);
    dimorphosLabel.position.set(
        0,
        Math.SQRT2 * objects.get(-658031).cameraRadius * distanceRatio,
        Math.SQRT2 * objects.get(-658031).cameraRadius * distanceRatio
    );

    const heraDiv = document.createElement('div');
    heraDiv.className = 'label';
    heraDiv.textContent = 'Hera';
    heraLabel = new CSS2DObject(heraDiv);
    heraLabel.layers.set(1);
    heraLabel.position.set(
        0,
        objects.get(-91000).cameraRadius / 5,
        0.002 + objects.get(-91000).cameraRadius / 5
    );

    const juventasDiv = document.createElement('div');
    juventasDiv.className = 'label';
    juventasDiv.textContent = 'Juventas';
    juventasLabel = new CSS2DObject(juventasDiv);
    juventasLabel.layers.set(1);
    juventasLabel.position.set(
        0,
        Math.SQRT2 * objects.get(-15513000).cameraRadius * distanceRatio,
        Math.SQRT2 * objects.get(-15513000).cameraRadius * distanceRatio
    );

    const milaniDiv = document.createElement('div');
    milaniDiv.className = 'label';
    milaniDiv.textContent = 'Milani';
    milaniLabel = new CSS2DObject(milaniDiv);
    milaniLabel.layers.set(1);
    milaniLabel.position.set(
        0,
        Math.SQRT2 * objects.get(-15513000).cameraRadius * distanceRatio,
        Math.SQRT2 * objects.get(-15513000).cameraRadius * distanceRatio
    );
}

export function toggleLabels() {
    cameras.forEach((cameraObject) => {
        cameraObject.camera.layers.toggle(1);
    });
}

export function loadObjects() {
    objects.get(0).group = new THREE.Group();
    objects.get(0).group.add(starFieldSurface);
    objects.get(0).group.add(starFieldLight);

    objects.get(10).group = new THREE.Group();
    objects.get(10).group.add(sunSurface);
    objects.get(10).group.add(sunLight);
    objects.get(10).group.add(sunLabel);

    objects.get(199).group = new THREE.Group();
    objects.get(199).group.add(mercurySurface);
    objects.get(199).group.add(mercuryLabel);

    objects.get(299).group = new THREE.Group();
    objects.get(299).group.add(venusSurface);
    objects.get(299).group.add(venusLabel);

    objects.get(399).group = new THREE.Group();
    objects.get(399).group.add(earthSurface);
    objects.get(399).group.add(earthLabel);

    objects.get(301).group = new THREE.Group();
    objects.get(301).group.add(moonSurface);
    objects.get(301).group.add(moonLabel);

    objects.get(499).group = new THREE.Group();
    objects.get(499).group.add(marsSurface);
    objects.get(499).group.add(marsLabel);

    objects.get(401).group = new THREE.Group();
    objects.get(401).group.add(phobosModel);
    objects.get(401).group.add(phobosLabel);
    
    objects.get(402).group = new THREE.Group();
    objects.get(402).group.add(deimosModel);
    objects.get(402).group.add(deimosLabel);

    objects.get(-658030).group = new THREE.Group();
    objects.get(-658030).group.add(didymosModel);
    objects.get(-658030).group.add(didymosLabel);

    objects.get(-658031).group = new THREE.Group();
    objects.get(-658031).group.add(dimorphosModel);
    objects.get(-658031).group.add(dimorphosLabel);

    objects.get(-91000).group = new THREE.Group();
    objects.get(-91000).group.add(heraModel);
    objects.get(-91000).group.add(cameras.get(-91400).camera);
    objects.get(-91000).group.add(cameras.get(-91110).camera);
    objects.get(-91000).group.add(cameras.get(-91120).camera);
    objects.get(-91000).group.add(heraLabel);

    objects.get(-15513000).group = new THREE.Group();
    objects.get(-15513000).group.add(juventasModel);
    objects.get(-15513000).group.add(cameras.get(-15513310).camera);
    objects.get(-15513000).group.add(juventasLabel);

    objects.get(-9102000).group = new THREE.Group();
    objects.get(-9102000).group.add(milaniModel);
    objects.get(-9102000).group.add(cameras.get(-9102310).camera);
    objects.get(-9102000).group.add(milaniLabel);
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
    objects.get(402).group.position.set(150000, 0, 300-20000);
    scene.add(objects.get(402).group);

    // DIDYMOS
    objects.get(-658030).group.position.set(150000, 0, 251-20000);
    scene.add(objects.get(-658030).group);

    // DIMORPHOS
    objects.get(-658031).group.position.set(150000, 0, 250-20000);
    scene.add(objects.get(-658031).group);

    // HERA
    objects.get(-91000).group.position.set(150000, 0, -20000);
    scene.add(objects.get(-91000).group);

    // JUVENTAS
    objects.get(-15513000).group.position.set(150000+0.005, 0, -20000);
    scene.add(objects.get(-15513000).group);

    // MILANI
    objects.get(-9102000).group.position.set(150000-0.005, 0.001, -20000);
    scene.add(objects.get(-9102000).group);
}

export async function loadThreeJSEngine() {
    init();
    loadTextures();
    loadMaterials();
    loadGeometry();
    loadSurfaces();
    await loadModels();
    loadLabels();
    loadObjects();
    loadScene();
    currentCamera = defaultCamera;
    const axisHelper = new THREE.AxesHelper(1E6);
    scene.add(axisHelper);
    initCameras();
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

        const rotationSpeed = 0.00005; // Adjust this value for faster/slower rotation
        objects.get(499).group.rotateOnAxis(new THREE.Vector3(0, 1, 0), rotationSpeed);
    }
    cameraControls.update();
    renderer.render(scene, currentCamera);
    labelRenderer.render(scene, currentCamera);
}