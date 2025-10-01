/*
 *  Copyright 2025 Mendel Dobondi-Reisz
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import {
    MeshStandardMaterial,
    MeshBasicMaterial,
    PerspectiveCamera,
    SphereGeometry,
    LoadingManager,
    TextureLoader,
    WebGLRenderer,
    AmbientLight,
    PointLight,
    AxesHelper,
    Quaternion,
    BackSide,
    Color,
    Scene,
    Group,
    Mesh
} from 'three';

import {
    updatePlaybackButton,
    updateSimulationTime,
    setSimulationDateTo,
    simulationRunning,
    firstPersonView,
    simulationTime,
    framesVisible,
    getObjectId,
    observerId,
 } from './controls';

 import {
    removeOutDatedTelemetryData,
    requestTelemetryData,
    updateObjectStates,
    cameraFOVs,
    objects,
    cameras,
} from './data';

import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { checkTime } from './websocket';
import { canvasName } from './config';
import { gsap } from 'gsap';



// ─────────────────────────────────────────────
// Local Variables
// ─────────────────────────────────────────────

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
let currentProgress = 0;



// ─────────────────────────────────────────────
// Initialization
// ─────────────────────────────────────────────

function init() {
    canvas = document.getElementById(canvasName);
    scene = new Scene();

    defaultCamera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1E-6, 1E12);
    defaultCamera.layers.enableAll();
    cameras.get(0).camera = defaultCamera;
    defaultCamera.position.set(0, 0, 1000);

    currentCamera = defaultCamera;
    currentCameraId = 0;

    renderer = new WebGLRenderer({ canvas: canvas, antialias: true, logarithmicDepthBuffer: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.zIndex = 1;
    document.body.appendChild(labelRenderer.domElement);

    cameraControls = new TrackballControls(defaultCamera, labelRenderer.domElement);
    cameraControls.enableDamping = true;
    cameraControls.dampingFactor = 0.03;
    cameraControls.enableZoom = true;

    const progressBarContainer = document.querySelector('.progress-bar-container');
    const progressBar = document.getElementById('progress-bar');

    loadingManager = new LoadingManager();

    loadingManager.onProgress = function (item, loaded, total) {
        const progress = (loaded / total) * 100;
        if(currentProgress < progress) currentProgress = progress;
        const bar = currentProgress < 100 ? String(currentProgress) : String(100);
        progressBar.style.width = bar + '%';
    };

    loadingManager.onLoad = function () {
        setTimeout(() => {
            progressBarContainer.style.display = 'none'
        }, 1000); // we need time to setup the camera
    };

    textureLoader = new TextureLoader(loadingManager);
    gltfLoader = new GLTFLoader(loadingManager);

    window.addEventListener('resize', () => {
        resizeCameraAspect();
        resizeCameraBox();
    });
}



// ─────────────────────────────────────────────
// Resize Handlers
// ─────────────────────────────────────────────

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
        width = windowHeight * cameras.get(currentCameraId).aspect - margin * windowWidth / windowHeight;
    }
    // Screen is taller than camera aspect → letterbox
    else {
        width = windowWidth - margin;
        height = windowWidth / cameras.get(currentCameraId).aspect - margin * windowHeight / windowWidth;
    }

    box.style.width = `${width}px`;
    box.style.height = `${height}px`;

    currentCamera.fov = (windowHeight - margin) / height * cameraFOVs.get(currentCameraId);
    currentCamera.updateProjectionMatrix();
}



// ─────────────────────────────────────────────
// Camera Handling
// ─────────────────────────────────────────────

export function changeCamera(cameraId) {
    if(cameraId === 0) {
        currentCameraId = 0;
        currentCamera = cameras.get(0).camera;
        resizeCameraAspect();
    }
    else {
        currentCameraId = cameraId;
        currentCamera = cameras.get(cameraId).camera;
        resizeCameraAspect();
        resizeCameraBox();
    }
    currentCamera.updateMatrix();
    currentCamera.updateMatrixWorld();
}

function initCameras() {
    setCameraOrientations();
    setCameraLayers();
}

function setCameraOrientations() {
    // HSH
    cameras.get(-91400).camera.position.set(-0.2760E-3, -0.6540E-3, 1.7835E-3);
    cameras.get(-91400).camera.rotateX(Math.PI);
    cameras.get(-91400).camera.rotateZ(-Math.PI / 2);
    
    // AFC2
    cameras.get(-91120).camera.position.set(-0.6895E-3, 0.3500E-3, 1.8821E-3);
    cameras.get(-91120).camera.rotateX(Math.PI);
    cameras.get(-91120).camera.rotateZ(Math.PI / 2);
    
    // AFC1
    cameras.get(-91110).camera.position.set(-0.6895E-3, -0.3500E-3, 1.8821E-3);
    cameras.get(-91110).camera.rotateZ(Math.PI / 2);
    cameras.get(-91110).camera.rotateX(Math.PI);
    
    // JNC
    cameras.get(-9101310).camera.position.set(-0.0427E-3, 0.0278E-3, 0.1743E-3);
    cameras.get(-9101310).camera.rotateZ(Math.PI / 2);
    cameras.get(-9101310).camera.rotateX(Math.PI);
    
    // MNC
    cameras.get(-9102310).camera.position.set(-0.0775E-3, -0.0019E-3, 0.1777E-3);
    cameras.get(-9102310).camera.rotateZ(Math.PI / 2);
    cameras.get(-9102310).camera.rotateX(Math.PI);
}

function setCameraLayers() {
    cameras.forEach((cameraObject) => {
        cameraObject.camera.layers.enableAll();
        cameraObject.camera.layers.disable(1);
        cameraObject.camera.layers.disable(2);
    });
}



// ─────────────────────────────────────────────
// Texture Loading
// ─────────────────────────────────────────────

let starFieldTexture;
let sunTexture;
let mercuryTexture;
let venusTexture;
let earthTexture;
let moonTexture;
let marsTexture;

function loadTextures() {
    starFieldTexture = textureLoader.load('/images/8k_stars.jpg');
    sunTexture = textureLoader.load('/images/8k_sun.jpg');
    mercuryTexture = textureLoader.load('/images/2k_mercury.jpg');
    venusTexture = textureLoader.load('/images/2k_venus.jpg');
    earthTexture = textureLoader.load('/images/2k_earth_daymap.jpg');
    moonTexture = textureLoader.load('/images/2k_moon.jpg');
    marsTexture = textureLoader.load('/images/2k_mars.jpg');
}



// ─────────────────────────────────────────────
// Model Loading
// ─────────────────────────────────────────────

let phobosModel;
let deimosModel;

let didymosModel;
let dimorphosModel;

let heraModel;
let juventasModel;
let milaniModel;

function loadModel(loader, url) {
    return new Promise((resolve, reject) => {
        loader.load(url, function(obj) { resolve(obj); }, undefined, reject);
    });
}

async function loadModels() {
    try {
        const promises = [
            loadModel(gltfLoader, '/models/phobos.glb'),
            loadModel(gltfLoader, '/models/deimos.glb'),
            loadModel(gltfLoader, '/models/didymos.glb'),
            loadModel(gltfLoader, '/models/dimorphos.glb'),
            loadModel(gltfLoader, '/models/hera.glb'),
            loadModel(gltfLoader, '/models/juventas.glb'),
            loadModel(gltfLoader, '/models/milani.glb')
        ];
        const [tmpPhobos, tmpDeimos, tmpDidymos, tmpDimorphos, tmpHera, tmpJuventas, tmpMilani] = await Promise.all(promises);

        tmpPhobos.scene.scale.set(1, 1, 1);
        phobosModel = tmpPhobos.scene;
        phobosModel.rotateZ(Math.PI / 2);
        phobosModel.rotateY(Math.PI / 2);

        tmpDeimos.scene.scale.set(1, 1, 1);
        deimosModel = tmpDeimos.scene;
        deimosModel.rotateX(Math.PI / 2);
        deimosModel.rotateY(Math.PI);

        didymosModel = tmpDidymos.scene.rotateX(Math.PI / 2);
        didymosModel = tmpDidymos.scene;
        dimorphosModel = tmpDimorphos.scene.rotateX(Math.PI / 2);
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



// ─────────────────────────────────────────────
// Material Loading
// ─────────────────────────────────────────────

let starFieldMaterial;

let sunMaterial;
let mercuryMaterial;
let venusMaterial;
let earthMaterial;
let moonMaterial;
let marsMaterial;

function loadMaterials() {
    starFieldMaterial = new MeshBasicMaterial({
        map: starFieldTexture,
        side: BackSide,
        color: new Color(0x555555)
    });
    sunMaterial = new MeshStandardMaterial({
        map: sunTexture,
        emissive: 0xffffff,
        emissiveMap: sunTexture,
        emissiveIntensity: 1.4
    });
    mercuryMaterial = new MeshStandardMaterial({ map: mercuryTexture });
    venusMaterial = new MeshStandardMaterial({ map: venusTexture });
    earthMaterial = new MeshStandardMaterial({ map: earthTexture });
    moonMaterial = new MeshStandardMaterial({ map: moonTexture });
    marsMaterial = new MeshStandardMaterial({ map: marsTexture });
}



// ─────────────────────────────────────────────
// Geometry Loading
// ─────────────────────────────────────────────

let starFieldGeometry;
let sunGeometry;
let mercuryGeometry;
let venusGeometry;
let earthGeometry;
let moonGeometry;
let marsGeometry;

function loadGeometry() {
    const heightSegments = 300;
    const widthSegments = 300;
    const sphereGeometry = new SphereGeometry(1, heightSegments, widthSegments);

    const scaleGeometry = (sphereGeometry, scale) => sphereGeometry.clone().scale(scale, scale, scale);

    starFieldGeometry = scaleGeometry(sphereGeometry, 1E25);
    sunGeometry = scaleGeometry(sphereGeometry, 696340);
    mercuryGeometry = scaleGeometry(sphereGeometry, 2439.7);
    venusGeometry = scaleGeometry(sphereGeometry, 6051.8);
    earthGeometry = scaleGeometry(sphereGeometry, 6378);
    moonGeometry = scaleGeometry(sphereGeometry, 1737.4);
    marsGeometry = scaleGeometry(sphereGeometry, 3389.5);
}



// ─────────────────────────────────────────────
// Surface Loading
// ─────────────────────────────────────────────

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
    starFieldSurface = new Mesh(starFieldGeometry, starFieldMaterial);
    starFieldSurface.rotateX(Math.PI / 2);
    starFieldLight = new AmbientLight(0xffffff, 0.0075);

    sunSurface = new Mesh(sunGeometry, sunMaterial);
    sunSurface.rotateX(Math.PI / 2);
    sunLight = new PointLight(0xffffff, 2, 0, 3);
    sunLight.decay = 0;
    sunLight.castShadow = true;

    mercurySurface = new Mesh(mercuryGeometry, mercuryMaterial);
    mercurySurface.castShadow = true;
    mercurySurface.receiveShadow = true;
    mercurySurface.rotateX(Math.PI / 2);

    venusSurface = new Mesh(venusGeometry, venusMaterial);
    venusSurface.castShadow = true;
    venusSurface.receiveShadow = true;
    venusSurface.rotateX(Math.PI / 2);

    earthSurface = new Mesh(earthGeometry, earthMaterial);
    earthSurface.castShadow = true;
    earthSurface.receiveShadow = true;
    earthSurface.rotateX(Math.PI / 2);

    moonSurface = new Mesh(moonGeometry, moonMaterial);
    moonSurface.castShadow = true;
    moonSurface.receiveShadow = true;
    moonSurface.rotateX(Math.PI / 2);

    marsSurface = new Mesh(marsGeometry, marsMaterial);
    marsSurface.castShadow = true;
    marsSurface.receiveShadow = true;
    marsSurface.rotateX(Math.PI / 2);
}



// ─────────────────────────────────────────────
// Label & Point Loading
// ─────────────────────────────────────────────

let sunLabel, sunX;
let mercuryLabel, mercuryX;
let venusLabel, venusX;
let earthLabel, earthX;
let moonLabel, moonX;
let marsLabel, marsX;
let phobosLabel, phobosX;
let deimosLabel, deimosX;
let didymosLabel, didymosX;
let dimorphosLabel, dimorphosX;
let dartImpactSiteLabel, dartImpactSiteX;
let heraLabel, heraX;
let juventasLabel, juventasX;
let milaniLabel, milaniX;

export function loadLabels() {

    const sunDivLabel = document.createElement('div');
    sunDivLabel.className = 'label';
    sunDivLabel.textContent = 'Sun';
    sunLabel = new CSS2DObject(sunDivLabel);
    sunLabel.center.set(-0.20, 1.25);
    sunLabel.layers.set(1);
    sunLabel.position.set(0, 0, 0);

    const sunDivX = document.createElement('div');
    sunDivX.className = 'x';
    sunDivX.textContent = 'X';
    sunX = new CSS2DObject(sunDivX);
    sunX.center.set(0.5, 0.5);
    sunX.layers.set(1);
    sunX.position.set(0, 0, 0);


    const mercuryDivLabel = document.createElement('div');
    mercuryDivLabel.className = 'label';
    mercuryDivLabel.textContent = 'Mercury';
    mercuryLabel = new CSS2DObject(mercuryDivLabel);
    mercuryLabel.center.set(-0.20, 1.25);
    mercuryLabel.layers.set(1);
    mercuryLabel.position.set(0, 0, 0);

    const mercuryDivX = document.createElement('div');
    mercuryDivX.className = 'x';
    mercuryDivX.textContent = 'X';
    mercuryX = new CSS2DObject(mercuryDivX);
    mercuryX.center.set(0.5, 0.5);
    mercuryX.layers.set(1);
    mercuryX.position.set(0, 0, 0);


    const venusDivLabel = document.createElement('div');
    venusDivLabel.className = 'label';
    venusDivLabel.textContent = 'Venus';
    venusLabel = new CSS2DObject(venusDivLabel);
    venusLabel.center.set(-0.20, 1.25);
    venusLabel.layers.set(1);
    venusLabel.position.set(0, 0, 0);

    const venusDivX = document.createElement('div');
    venusDivX.className = 'x';
    venusDivX.textContent = 'X';
    venusX = new CSS2DObject(venusDivX);
    venusX.center.set(0.5, 0.5);
    venusX.layers.set(1);
    venusX.position.set(0, 0, 0);


    const earthDivLabel = document.createElement('div');
    earthDivLabel.textContent = 'Earth';
    earthDivLabel.className = 'label';
    earthLabel = new CSS2DObject(earthDivLabel);
    earthLabel.center.set(-0.20, 1.25);
    earthLabel.layers.set(1);
    earthLabel.position.set(0, 0, 0);

    const earthDivX = document.createElement('div');
    earthDivX.className = 'x';
    earthDivX.textContent = 'X';
    earthX = new CSS2DObject(earthDivX);
    earthX.center.set(0.5, 0.5);
    earthX.layers.set(1);
    earthX.position.set(0, 0, 0);


    const moonDivLabel = document.createElement('div');
    moonDivLabel.className = 'label';
    moonDivLabel.textContent = 'Moon';
    moonLabel = new CSS2DObject(moonDivLabel);
    moonLabel.center.set(-0.20, 1.25);
    moonLabel.layers.set(1);
    moonLabel.position.set(0, 0, 0);

    const moonDivX = document.createElement('div');
    moonDivX.className = 'x';
    moonDivX.textContent = 'X';
    moonX = new CSS2DObject(moonDivX);
    moonX.center.set(0.5, 0.5);
    moonX.layers.set(1);
    moonX.position.set(0, 0, 0);


    const marsDivLabel = document.createElement('div');
    marsDivLabel.className = 'label';
    marsDivLabel.textContent = 'Mars';
    marsLabel = new CSS2DObject(marsDivLabel);
    marsLabel.center.set(-0.20, 1.25);
    marsLabel.layers.set(1);
    marsLabel.position.set(0, 0, 0);

    const marsDivX = document.createElement('div');
    marsDivX.className = 'x';
    marsDivX.textContent = 'X';
    marsX = new CSS2DObject(marsDivX);
    marsX.center.set(0.5, 0.5);
    marsX.layers.set(1);
    marsX.position.set(0, 0, 0);


    const phobosDivLabel = document.createElement('div');
    phobosDivLabel.className = 'label';
    phobosDivLabel.textContent = 'Phobos';
    phobosLabel = new CSS2DObject(phobosDivLabel);
    phobosLabel.center.set(-0.20, 1.25);
    phobosLabel.layers.set(1);
    phobosLabel.position.set(0, 0, 0);

    const phobosDivX = document.createElement('div');
    phobosDivX.className = 'x';
    phobosDivX.textContent = 'X';
    phobosX = new CSS2DObject(phobosDivX);
    phobosX.center.set(0.5, 0.5);
    phobosX.layers.set(1);
    phobosX.position.set(0, 0, 0);


    const deimosDivLabel = document.createElement('div');
    deimosDivLabel.className = 'label';
    deimosDivLabel.textContent = 'Deimos';
    deimosLabel = new CSS2DObject(deimosDivLabel);
    deimosLabel.center.set(-0.20, 1.25);
    deimosLabel.layers.set(1);
    deimosLabel.position.set(0, 0, 0);

    const deimosDivX = document.createElement('div');
    deimosDivX.className = 'x';
    deimosDivX.textContent = 'X';
    deimosX = new CSS2DObject(deimosDivX);
    deimosX.center.set(0.5, 0.5);
    deimosX.layers.set(1);
    deimosX.position.set(0,0,0);


    const didymosDivLabel = document.createElement('div');
    didymosDivLabel.className = 'label';
    didymosDivLabel.textContent = 'Didymos';
    didymosLabel = new CSS2DObject(didymosDivLabel);
    didymosLabel.center.set(-0.20, 1.25);
    didymosLabel.layers.set(1);
    didymosLabel.position.set(0, 0, 0);

    const didymosDivX = document.createElement('div');
    didymosDivX.className = 'x';
    didymosDivX.textContent = 'X';
    didymosX = new CSS2DObject(didymosDivX);
    didymosX.center.set(0.5, 0.5);
    didymosX.layers.set(1);
    didymosX.position.set(0, 0, 0);


    const dimorphosDivLabel = document.createElement('div');
    dimorphosDivLabel.className = 'label';
    dimorphosDivLabel.textContent = 'Dimorphos';
    dimorphosLabel = new CSS2DObject(dimorphosDivLabel);
    dimorphosLabel.center.set(-0.20, 1.25);
    dimorphosLabel.layers.set(1);
    dimorphosLabel.position.set(0, 0, 0);

    const dimorphosDivX = document.createElement('div');
    dimorphosDivX.className = 'x';
    dimorphosDivX.textContent = 'X';
    dimorphosX = new CSS2DObject(dimorphosDivX);
    dimorphosX.center.set(0.5, 0.5);
    dimorphosX.layers.set(1);
    dimorphosX.position.set(0, 0, 0);


    const dartImpactSiteDivLabel = document.createElement('div');
    dartImpactSiteDivLabel.className = 'label';
    dartImpactSiteDivLabel.textContent = 'Dart Impact Site';
    dartImpactSiteLabel = new CSS2DObject(dartImpactSiteDivLabel);
    dartImpactSiteLabel.center.set(-0.20, 1.25);
    dartImpactSiteLabel.layers.set(1);
    dartImpactSiteLabel.position.set(0, 0, 0);

    const dartImpactSiteDivX = document.createElement('div');
    dartImpactSiteDivX.className = 'x';
    dartImpactSiteDivX.textContent = 'X';
    dartImpactSiteX = new CSS2DObject(dartImpactSiteDivX);
    dartImpactSiteX.center.set(0.5, 0.5);
    dartImpactSiteX.layers.set(1);
    dartImpactSiteX.position.set(0, 0, 0);


    const heraDivLabel = document.createElement('div');
    heraDivLabel.className = 'label';
    heraDivLabel.textContent = 'Hera';
    heraLabel = new CSS2DObject(heraDivLabel);
    heraLabel.center.set(-0.20, 1.25);
    heraLabel.layers.set(1);
    heraLabel.position.set(0, 0, 0);

    const heraDivX = document.createElement('div');
    heraDivX.className = 'x';
    heraDivX.textContent = 'X';
    heraX = new CSS2DObject(heraDivX);
    heraX.center.set(0.5, 0.5);
    heraX.layers.set(1);
    heraX.position.set(0,0,0);


    const juventasDivLabel = document.createElement('div');
    juventasDivLabel.className = 'label';
    juventasDivLabel.textContent = 'Juventas';
    juventasLabel = new CSS2DObject(juventasDivLabel);
    juventasLabel.center.set(-0.20, 1.25);
    juventasLabel.layers.set(1);
    juventasLabel.position.set(0, 0, 0);

    const juventasDivX = document.createElement('div');
    juventasDivX.className = 'x';
    juventasDivX.textContent = 'X';
    juventasX = new CSS2DObject(juventasDivX);
    juventasX.center.set(0.5, 0.5);
    juventasX.layers.set(1);
    juventasX.position.set(0,0,0);


    const milaniDivLabel = document.createElement('div');
    milaniDivLabel.className = 'label';
    milaniDivLabel.textContent = 'Milani';
    milaniLabel = new CSS2DObject(milaniDivLabel);
    milaniLabel.center.set(-0.20, 1.25);
    milaniLabel.layers.set(1);
    milaniLabel.position.set(0, 0, 0);

    const milaniDivX = document.createElement('div');
    milaniDivX.className = 'x';
    milaniDivX.textContent = 'X';
    milaniX = new CSS2DObject(milaniDivX);
    milaniX.center.set(0.5, 0.5);
    milaniX.layers.set(1);
    milaniX.position.set(0, 0, 0);
}



// ─────────────────────────────────────────────
// Visibility Handling
// ─────────────────────────────────────────────

function getScreenPosition(object) {
    const vector = object.group.position.clone().project(currentCamera);
    return {
        x: (vector.x * 0.5 + 0.5) * labelRenderer.domElement.clientWidth,
        y: (-vector.y * 0.5 + 0.5) * labelRenderer.domElement.clientHeight
    };
}

function calculateDistance(id, targetId) {
    const pos1 = getScreenPosition(objects.get(id));
    const pos2 = getScreenPosition(objects.get(targetId));
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

export function updateSecondaryObjectVisibility(id) {
    let hideBool = true;
    const minDistance = 5; // 25

    switch(id) {
        case 301:
            if(calculateDistance(301, 399) < minDistance) hide(id);
            else hideBool = false;
            break;
        case 401:
            if(calculateDistance(401, 499) < minDistance) hide(id);
            else hideBool = false;
            break;
        case 402:
            if(calculateDistance(402, 499) < minDistance) hide(id);
            else hideBool = false;
            break;
        case -658031:
            if(calculateDistance(-658031, -658030) < minDistance) hide(id);
            else hideBool = false;
            break;
        case -91900:
            if(observerId != -658031) { hide(id); return true; }
            if(calculateDistance(-91900, -658031) < minDistance) hide(id);
            else hideBool = false;
            break;
        case -9102000:
            if(calculateDistance(-9102000, -91000) < minDistance) hide(id);
            else hideBool = false;
            break;
        case -9101000:
            if(calculateDistance(-9101000, -91000) < minDistance) hide(id);
            else hideBool = false;
            break;
        default:
            hideBool = false;
            break;
    }
    return hideBool;
}

export function toggleLabels() {
    cameras.forEach((cameraObject) => {
        cameraObject.camera.layers.toggle(1);
    });
}

export function hide(id) {
    if(objects.get(id).group.visible) objects.get(id).group.visible = false;
}

export function show(id) {
    if(!objects.get(id).group.visible) objects.get(id).group.visible = true;
}



// ─────────────────────────────────────────────
// Axes Loading
// ─────────────────────────────────────────────

export let frames = [];

function loadAxes() {
    objects.forEach((obj) => {
        const frame = new AxesHelper(obj.cameraRadius * 2);
        frames.push(frame);
        obj.group.add(frame);
        frame.visible = framesVisible;
    });
}



// ─────────────────────────────────────────────
// Object Loading
// ─────────────────────────────────────────────

export let ambientLight = new AmbientLight();

export function loadObjects() {
    objects.get(0).group = new Group();
    objects.get(0).group.add(starFieldSurface);
    objects.get(0).group.add(starFieldLight);

    objects.get(10).group = new Group();
    objects.get(10).group.add(sunSurface);
    objects.get(10).group.add(sunLight);
    objects.get(10).group.add(sunLabel);
    objects.get(10).group.add(sunX);

    objects.get(199).group = new Group();
    objects.get(199).group.add(mercurySurface);
    objects.get(199).group.add(mercuryLabel);
    objects.get(199).group.add(mercuryX);

    objects.get(299).group = new Group();
    objects.get(299).group.add(venusSurface);
    objects.get(299).group.add(venusLabel);
    objects.get(299).group.add(venusX);

    objects.get(399).group = new Group();
    objects.get(399).group.add(earthSurface);
    objects.get(399).group.add(earthLabel);
    objects.get(399).group.add(earthX);

    objects.get(301).group = new Group();
    objects.get(301).group.add(moonSurface);
    objects.get(301).group.add(moonLabel);
    objects.get(301).group.add(moonX);

    objects.get(499).group = new Group();
    objects.get(499).group.add(marsSurface);
    objects.get(499).group.add(marsLabel);
    objects.get(499).group.add(marsX);

    objects.get(401).group = new Group();
    objects.get(401).group.add(phobosModel);
    objects.get(401).group.add(phobosLabel);
    objects.get(401).group.add(phobosX);

    objects.get(402).group = new Group();
    objects.get(402).group.add(deimosModel);
    objects.get(402).group.add(deimosLabel);
    objects.get(402).group.add(deimosX);

    objects.get(-658030).group = new Group();
    objects.get(-658030).group.add(didymosModel);
    objects.get(-658030).group.add(didymosLabel);
    objects.get(-658030).group.add(didymosX);

    objects.get(-658031).group = new Group();
    objects.get(-658031).group.add(dimorphosModel);
    objects.get(-658031).group.add(dimorphosLabel);
    objects.get(-658031).group.add(dimorphosX);

    objects.get(-91900).group = new Group();
    objects.get(-91900).group.add(dartImpactSiteLabel);
    objects.get(-91900).group.add(dartImpactSiteX);

    objects.get(-91000).group = new Group();
    objects.get(-91000).group.add(heraModel);
    objects.get(-91000).group.add(cameras.get(-91400).camera);
    objects.get(-91000).group.add(cameras.get(-91110).camera);
    objects.get(-91000).group.add(cameras.get(-91120).camera);
    objects.get(-91000).group.add(heraLabel);
    objects.get(-91000).group.add(heraX);

    objects.get(-9101000).group = new Group();
    objects.get(-9101000).group.add(juventasModel);
    objects.get(-9101000).group.add(cameras.get(-9101310).camera);
    objects.get(-9101000).group.add(juventasLabel);
    objects.get(-9101000).group.add(juventasX);

    objects.get(-9102000).group = new Group();
    objects.get(-9102000).group.add(milaniModel);
    objects.get(-9102000).group.add(cameras.get(-9102310).camera);
    objects.get(-9102000).group.add(milaniLabel);
    objects.get(-9102000).group.add(milaniX);
}



// ─────────────────────────────────────────────
// Scene Loading
// ─────────────────────────────────────────────

export function loadScene() {

    ambientLight.visible = false;
    scene.add(ambientLight);

    /**
     * Test date: 2025-03-12T09:27:00.000
    */

    // STARFIELD (Solar System Barycenter)
    objects.get(0).group.position.set(1.9251E+08, -1.4052E+08, -6.9666E+07);
    scene.add(objects.get(0).group);

    // SUN
    objects.get(10).group.position.set(1.9173E+08, -1.4123E+08, -6.9948E+07);
    objects.get(10).group.rotation.setFromQuaternion(new Quaternion(-1.6179E-01, 1.5788E-01, -4.5985E-01, 8.5874E-01));
    scene.add(objects.get(10).group);

    // MERCURY
    objects.get(199).group.position.set(1.6388E+08, -1.0724E+08, -4.8904E+07);
    objects.get(199).group.rotation.setFromQuaternion(new Quaternion(1.9525E-01, 1.5109E-01, -4.3590E-01, 8.6547E-01));
    scene.add(objects.get(199).group);

    // VENUS
    objects.get(299).group.position.set(8.7963E+07, -1.1833E+08, -5.3075E+07);
    objects.get(299).group.rotation.setFromQuaternion(new Quaternion(4.4608E-02, 1.9291E-01, -9.4326E-01, 2.6656E-01));
    scene.add(objects.get(299).group);

    // EARTH
    objects.get(399).group.position.set(4.4632E+07, -1.2156E+08, -6.1420E+07);
    objects.get(399).group.rotation.setFromQuaternion(new Quaternion(-4.9788E-04, 1.1188E-03, -4.0914E-01,  9.1247E-01));
    scene.add(objects.get(399).group);

    // MOON
    objects.get(301).group.position.set(4.4288E+07, -1.2139E+08, -6.1327E+07);
    objects.get(301).group.rotation.setFromQuaternion(new Quaternion(1.8123E-01, 5.6576E-02, -2.8862E-01, 9.3843E-01));
    scene.add(objects.get(301).group);

    // MARS
    objects.get(499).group.position.set(-7.7896E+04, 6.6413E+04, 3.6204E+04);
    objects.get(499).group.rotation.setFromQuaternion(new Quaternion(-5.5099E-02, 3.1357E-01, -7.5018E-01, 5.7955E-01));
    scene.add(objects.get(499).group);

    // PHOBOS
    objects.get(401).group.position.set(-7.0768E+04, 6.3378E+04, 3.0722E+04);
    objects.get(401).group.rotation.setFromQuaternion(new Quaternion(2.7615E-01, -1.4949E-01, 9.2741E-01, 2.0321E-01));
    scene.add(objects.get(401).group);

    // DEIMOS
    objects.get(402).group.position.set(-7.0792E+04, 4.8236E+04, 2.3179E+04);
    objects.get(402).group.rotation.setFromQuaternion(new Quaternion(2.9867E-01, -7.3580E-02, 8.0370E-01, 5.0937E-01));
    scene.add(objects.get(402).group);

    // DIDYMOS
    objects.get(-658030).group.position.set(7.2882E+07, 1.5587E+07, 8.7648E+06);
    objects.get(-658030).group.rotation.setFromQuaternion(new Quaternion(-8.2851E-01, -5.3685E-01, -1.4061E-01, 7.4744E-02));
    scene.add(objects.get(-658030).group);

    // DIMORPHOS - There was no data available for dimorphos at the given time.
    objects.get(-658031).group.position.set(7.2882E+07 + 1, 1.5587E+07, 8.7648E+06);
    scene.add(objects.get(-658031).group);
    objects.get(-91900).group.position.set(7.2882E+07  + 0.06002207374076425, 1.5587E+07 + 0.037749042560167825, 8.7648E+06 - 0.0411256870578024);
    scene.add(objects.get(-91900).group);

    // HERA
    objects.get(-91000).group.position.set(0, 0, 0);
    objects.get(-91000).group.rotation.setFromQuaternion(new Quaternion(-4.1667E-01, -3.9962E-01, 8.1776E-02, 8.1240E-01));
    scene.add(objects.get(-91000).group);

    // JUVENTAS
    objects.get(-9101000).group.position.set(-1.1518E-03, 6.0178E-04, 9.9444E-04);
    objects.get(-9101000).group.rotation.setFromQuaternion(new Quaternion(-5.7721E-01, 1.2055E-02, 6.3228E-01, 5.1663E-01));
    scene.add(objects.get(-9101000).group);

    // MILANI
    objects.get(-9102000).group.position.set(-1.0378E-03, 1.2649E-03, 2.2979E-05);
    objects.get(-9102000).group.rotation.setFromQuaternion(new Quaternion(-5.7721E-01, 1.2055E-02, 6.3228E-01, 5.1663E-01));
    scene.add(objects.get(-9102000).group);
}



// ─────────────────────────────────────────────
// Scene Loading
// ─────────────────────────────────────────────

export async function loadThreeJSEngine() {
    init();
    loadTextures();
    loadMaterials();
    loadGeometry();
    loadSurfaces();
    await loadModels();
    loadLabels();
    loadObjects();
    loadAxes();
    loadScene();
    currentCamera = defaultCamera;
    initCameras();
}



// ─────────────────────────────────────────────
// Camera Movement
// ─────────────────────────────────────────────

export function getCameraId(cameraName) {
    for (let [id, name] of cameras) {
        if (name === cameraName) return id;
    }
    return -91000;  // Default Hera
}

let lastObjectId = -91000;  // Default Hera

export async function gsapCamera() {
    objects.get(lastObjectId).group.visible = true;
    lastObjectId = getObjectId();

    setSimulationDateTo(simulationTime, simulationRunning);

    const startTime = Date.now();
    const maxWaitTime = 1000;

    while (objects.get(getObjectId()).group.position.x !== 0 && Date.now() - startTime < maxWaitTime) {
        await new Promise(resolve => requestAnimationFrame(resolve));
    }

    moveCamera();
}

function moveCamera() {
    const object = objects.get(getObjectId());

    cameraControls.enabled = false;
    cameraControls.target = object.group.position;
    cameraControls.minDistance = object.cameraRadius * 1.05;
    cameraControls.maxDistance = objects.get(10).cameraRadius * 2500;
    cameraControls.update();

    let distance;
    let direction;

    if(firstPersonView && !simulationRunning) {
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
            defaultCamera.updateMatrix();
            defaultCamera.updateMatrixWorld();
        }
    });

    cameraControls.enabled = true;
    cameraControls.update();
}

export function gsapCameraFPV() {
    const object = objects.get(observerId);

    cameraControls.enabled = false;
    cameraControls.update();

    let distance;
    let direction;

    if (firstPersonView) {
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
        cameraControls.maxDistance = objects.get(10).cameraRadius * 2500;
        cameraControls.enableZoom = true;
        show(observerId);
    }

    const newPosition = object.group.position.clone().add(direction.multiplyScalar(distance));

    gsap.to(defaultCamera.position, {
        x: newPosition.x,
        y: newPosition.y,
        z: newPosition.z,
        duration: 0.25,
        onUpdate: () => {
            cameraControls.update();
            defaultCamera.updateMatrix();
            defaultCamera.updateMatrixWorld();
        },
        onComplete: () => {
            cameraControls.enabled = true; // Re-enable user control
            if(firstPersonView) {
                cameraControls.enableZoom = false;
                hide(observerId);
                if(observerId != lastObjectId) {
                    show(lastObjectId);
                    lastObjectId = observerId;
                }
            }
        }
    });
}



// ─────────────────────────────────────────────
// Animation
// ─────────────────────────────────────────────

export function animate() {
    if(simulationRunning) {
        removeOutDatedTelemetryData();
        updateSimulationTime();
        updatePlaybackButton();
    }
    checkTime();
    requestTelemetryData();
    updateObjectStates();
    cameraControls.update();
    renderer.render(scene, currentCamera);
    labelRenderer.render(scene, currentCamera);
    requestAnimationFrame(animate);
}
