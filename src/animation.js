import * as THREE from 'three';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { gsap } from 'gsap';

import { canvasName } from './config';
import { objects, cameras, cameraFOVs } from './data';
import * as ctrl from './controls';
import * as data from './data';

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

    currentCamera.fov = (windowHeight - margin) / height * cameraFOVs.get(currentCameraId);
    currentCamera.updateProjectionMatrix();
}

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
}

function initCameras() {
    setCameraOrientations();
    setCameraLayers();
}

function setCameraOrientations() {
    cameras.get(-91400).camera.rotateX(Math.PI);
    cameras.get(-91400).camera.rotateZ(Math.PI);
    cameras.get(-91120).camera.rotateX(Math.PI);
    cameras.get(-91110).camera.rotateX(Math.PI);
    cameras.get(-91110).camera.rotateZ(Math.PI);
    cameras.get(-15513310).camera.rotateX(Math.PI);
    cameras.get(-15513310).camera.rotateZ(Math.PI);
    cameras.get(-9102310).camera.rotateX(Math.PI);
    cameras.get(-9102310).camera.rotateZ(Math.PI);
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
    starFieldSurface.rotateX(Math.PI / 2);
    starFieldLight = new THREE.AmbientLight(0xffffff, 0.015);

    sunSurface = new THREE.Mesh(sunGeometry, sunMaterial);
    sunSurface.rotateX(Math.PI / 2);
    sunLight = new THREE.PointLight(0xffffff, 2, 0, 3);
    sunLight.decay = 0;
    sunLight.castShadow = true;

    mercurySurface = new THREE.Mesh(mercuryGeometry, mercuryMaterial);
    mercurySurface.castShadow = true;
    mercurySurface.receiveShadow = true;
    mercurySurface.rotateX(Math.PI / 2);
    
    venusSurface = new THREE.Mesh(venusGeometry, venusMaterial);
    venusSurface.castShadow = true;
    venusSurface.receiveShadow = true;
    venusSurface.rotateX(Math.PI / 2);
    
    earthSurface = new THREE.Mesh(earthGeometry, earthMaterial);
    earthSurface.castShadow = true;
    earthSurface.receiveShadow = true;
    earthSurface.rotateX(Math.PI / 2);
    
    moonSurface = new THREE.Mesh(moonGeometry, moonMaterial);
    moonSurface.castShadow = true;
    moonSurface.receiveShadow = true;
    moonSurface.rotateX(Math.PI / 2);
    
    marsSurface = new THREE.Mesh(marsGeometry, marsMaterial);
    marsSurface.castShadow = true;
    marsSurface.receiveShadow = true;
    marsSurface.rotateX(Math.PI / 2);
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

    /** 
     * Test date: 2025-03-12T09:27:00.000
    */


    // SOLAR SYSTEM BARYCENTER

    /**
     *           0   00 00 00 00
     *
     *  1.9251E+08   C9 9B FE 02  02 F3 A6 41
     * -1.4052E+08   C7 13 F8 24  41 C0 A0 C1
     * -6.9666E+07   FC 32 EE F8  11 9C 90 C1
     *
     *  2.0666E+01   6D 9F C3 4F  70 AA 34 40
     *  9.4883E+00   BC 4D 82 1E  04 FA 22 40
     *  4.3334E+00   EE 48 37 95  6D 55 11 40
     *
     *  2.0317E-01   FB 55 30 92  A1 01 CA 3F
     * -1.2432E-03   85 F4 2E 92  50 5E 54 BF
     *  5.9666E-03   21 FC 1D 39  73 70 78 3F
     *  9.7912E-01   5F 08 0C D8  FA 54 EF 3F
     *
     *  0.0000E+00   00 00 00 00  00 00 00 00
     *  0.0000E+00   00 00 00 00  00 00 00 00
     *  0.0000E+00   00 00 00 00  00 00 00 00
     */

    // STARFIELD

    objects.get(0).group.position.set(1.9251E+08, -1.4052E+08, -6.9666E+07);
    scene.add(objects.get(0).group);



    // SUN

    /**
     *          10   0A 00 00 00 
     * 
     *  1.9173E+08   B2 04 18 3A  2D DB A6 41
     * -1.4123E+08   72 CC CD 68  15 D6 A0 C1
     * -6.9948E+07   68 E8 4B 4B  4C AD 90 C1
     *   
     *  2.0678E+01   41 59 A8 73  AA AD 34 40
     *  9.4840E+00   74 E3 22 F4  C8 F7 22 40
     *  4.3313E+00   21 25 41 09  41 53 11 40
     *   
     *  1.6179E-01   6F 47 AD EA  83 B5 C4 3F
     *  1.5788E-01   F6 F6 86 48  5D 35 C4 3F
     * -4.5985E-01   97 CD F3 71  43 6E DD BF
     *  8.5874E-01   81 19 B9 5D  C9 7A EB 3F
     *
     *  0.0000E+00   00 00 00 00  00 00 00 00
     *  5.2940E-23   00 00 00 00  00 00 50 3B
     * -2.8653E-06   C8 70 53 A3  3F 09 C8 BE
     */
    objects.get(10).group.position.set(1.9173E+08, -1.4123E+08, -6.9948E+07);
    objects.get(10).group.rotation.setFromQuaternion(new THREE.Quaternion(-1.6179E-01, 1.5788E-01, -4.5985E-01, 8.5874E-01));
    scene.add(objects.get(10).group);



    // MERCURY

    /**
     *         199   C7 00 00 00 
     *
     *  1.6388E+08   FE 86 1F CC  38 89 A3 41
     * -1.0724E+08   AD 66 B3 76  87 91 99 C1
     * -4.8904E+07   F2 02 A8 C7  AD 51 87 C1
     * 
     * -2.8983E+01   73 D5 15 A4  B6 FB 3C C0
     * -1.5469E+01   68 1A C2 1F  01 F0 2E C0
     * -3.8514E+00   44 75 C1 17  B4 CF 0E C0
     * 
     *  1.9525E-01   87 27 0C 69  D0 FD C8 3F
     *  1.5109E-01   F6 EF 19 F5  E5 56 C3 3F
     * -4.3590E-01   9B 33 42 11  BD E5 DB BF
     *  8.6547E-01   F3 B8 7A F1  F5 B1 EB 3F
     * 
     * -9.0001E-14   94 85 5E 61  41 55 39 BD
     *  1.2960E-14   00 00 00 FF  D1 2E 0D 3D
     * -1.2401E-06   FD 48 1D C1  53 CE B4 BE
    */
    objects.get(199).group.position.set(1.6388E+08, -1.0724E+08, -4.8904E+07);
    objects.get(199).group.rotation.setFromQuaternion(new THREE.Quaternion(1.9525E-01, 1.5109E-01, -4.3590E-01, 8.6547E-01));
    scene.add(objects.get(199).group);



    // VENUS

    /**
     *         299   2B 01 00 00
     * 
     *  8.7963E+07   A8 33 57 8F  D2 F8 94 41
     * -1.1833E+08   37 58 4A B6  FC 35 9C C1
     * -5.3075E+07   12 AE 28 05  EF 4E 89 C1
     * 
     *  1.1464E+01   B8 EA 4C 6B  88 ED 26 40
     * -2.1729E+01   C0 8A 97 5B  A7 BA 35 C0
     * -9.1306E+00   E1 D6 58 59  DF 42 22 C0
     * 
     *  4.4608E-02   14 B1 55 0F  D9 D6 A6 3F
     *  1.9291E-01   55 B6 01 39  3F B1 C8 3F
     * -9.4326E-01   8A 3B 2F 15  31 2F EE BF
     *  2.6656E-01   DE 44 59 15  5B 0F D1 3F
     * 
     *  0.0000E+00   00 00 00 00  00 00 00 00
     *  1.3235E-23   00 00 00 00  00 00 30 3B
     *  2.9924E-07   32 3C 6B 2C  FD 14 94 3E 
     */
    objects.get(299).group.position.set(8.7963E+07, -1.1833E+08, -5.3075E+07);
    objects.get(299).group.rotation.setFromQuaternion(new THREE.Quaternion(4.4608E-02, 1.9291E-01, -9.4326E-01, 2.6656E-01));
    scene.add(objects.get(299).group);



    // EARTH

    /**
     *         399   0F 00 00 00
     * 
     *  4.4632E+07   AC AE 15 73  44 48 85 41
     * -1.2156E+08   C6 EE 97 28  81 FB 9C C1  
     * -6.1420E+07   6A FE 94 F6  91 49 8D C1  
     * 
     *  1.5904E+01   A3 D3 5E 8D  B0 CE 2F 40  
     * -1.7655E+01   A8 2B 88 0D  96 A7 31 C0  
     * -7.4318E+00   CE C6 D1 A8  21 BA 1D C0  
     * 
     * -4.9788E-04   D2 8F A7 17  7D 50 40 BF  
     *  1.1188E-03   D1 E9 29 09  9F 54 52 3F  
     * -4.0914E-01   A1 A8 02 49  59 2F DA BF  
     *  9.1247E-01   FB 77 17 05  F6 32 ED 3F  
     * 
     *  2.2885E-12   D5 C3 01 F4  54 21 84 3D  
     * -2.0622E-12   00 00 07 2E  8D 23 82 BD  
     * -7.2921E-05   80 34 2A D2  A7 1D 13 BF
     */
    objects.get(399).group.position.set(4.4632E+07, -1.2156E+08, -6.1420E+07);
    objects.get(399).group.rotation.setFromQuaternion(new THREE.Quaternion(-4.9788E-04, 1.1188E-03, -4.0914E-01,  9.1247E-01));
    scene.add(objects.get(399).group);



    // MOON

    /**
     *         301   2D 01 00 00
     * 
     *  4.4288E+07   24 33 75 48  33 1E 85 41
     * -1.2139E+08   91 61 5C D2  F4 F0 9C C1
     * -6.1327E+07   19 DC F0 83  3D 3E 8D C1
     * 
     *  1.5382E+01   9A 75 58 23  78 C3 2E 40
     * -1.8397E+01   84 C7 41 DF  8D 65 32 C0
     * -7.8411E+00   50 20 B8 F1  50 5D 1F C0
     * 
     *  1.8123E-01   82 D7 B4 CD  95 32 C7 3F
     *  5.6576E-02   0F 1B FF B5  8E F7 AC 3F
     * -2.8862E-01   D6 BB 16 36  B3 78 D2 BF
     *  9.3843E-01   CC B6 BD 8E  A2 07 EE 3F
     * 
     *  8.1107E-10   5A D3 44 FD  41 DE 0B 3E
     *  3.6739E-10   00 70 8E F3  3C 3F F9 3D  
     * -2.6618E-06   BB DF FE BA  43 54 C6 BE
     */
    objects.get(301).group.position.set(4.4288E+07, -1.2139E+08, -6.1327E+07);
    objects.get(301).group.rotation.setFromQuaternion(new THREE.Quaternion(1.8123E-01, 5.6576E-02, -2.8862E-01, 9.3843E-01));
    scene.add(objects.get(301).group);



    // MARS

    /**
     *         499   F3 01 00 00
     * 
     * -7.7896E+04   00 30 F6 A0  7C 04 F3 C0  
     *  6.6413E+04   00 C8 A0 B9  CF 36 F0 40  
     *  3.6204E+04   00 78 04 ED  7B AD E1 40
     *   
     *  6.2149E+00   3A 99 51 7D  0C DC 18 40  
     * -5.8027E+00   30 8E CC EE  F1 35 17 C0  
     * -2.2902E+00   2E 8E D4 73  4F 52 02 C0
     *   
     * -5.5099E-02   74 51 19 E2  F3 35 AC BF
     *  3.1357E-01   6F 3A 4C 73  81 11 D4 3F  
     * -7.5018E-01   14 A6 62 A0  72 01 E8 BF  
     *  5.7955E-01   D2 F5 D2 71  A4 8B E2 3F
     *   
     * -2.3559E-13   90 01 47 9F  0C 94 50 BD  
     * -6.0461E-13   00 00 00 AC  D5 45 65 BD  
     * -7.0882E-05   46 04 3C 95  D2 94 12 BF
     */
    objects.get(499).group.position.set(-7.7896E+04, 6.6413E+04, 3.6204E+04);
    objects.get(499).group.rotation.setFromQuaternion(new THREE.Quaternion(-5.5099E-02, 3.1357E-01, -7.5018E-01, 5.7955E-01));
    scene.add(objects.get(499).group);



    // PHOBOS

    /**
     *         401   91 01 00 00
     *
     * -7.0768E+04   00 80 5B A5  FB 46 F1 C0
     *  6.3378E+04   00 20 6B 4B  37 F2 EE 40
     *  3.0722E+04   00 C0 A4 C4  7A 00 DE 40
     * 
     *  7.2181E+00   50 EC A5 EA  50 DF 1C 40
     * -3.9730E+00   0C 91 BE D6  B5 C8 0F C0
     * -1.9665E+00   24 16 B9 59  CE 76 FF BF
     * 
     *  2.7615E-01   6A 43 22 F3  81 AC D1 3F
     * -1.4949E-01   A2 F0 8B 8F  67 22 C3 BF
     *  9.2741E-01   A5 C3 60 55  61 AD ED 3F
     *  2.0321E-01   4D 58 62 61  D0 02 CA 3F
     * 
     * -3.4363E-10   05 A6 1B 7D  2F 9D F7 BD
     *  1.5996E-09   00 00 0D 65  33 7B 1B 3E
     * -2.3170E-04   D5 07 92 99  A9 5E 2E BF  
     */
    objects.get(401).group.position.set(-7.0768E+04, 6.3378E+04, 3.0722E+04);
    objects.get(401).group.rotation.setFromQuaternion(new THREE.Quaternion(2.7615E-01, -1.4949E-01, 9.2741E-01, 2.0321E-01));
    scene.add(objects.get(401).group);



    // DEIMOS

    /**
     *         402   92 01 00 00
     * 
     * -7.0792E+04   00 B0 09 E3  7E 48 F1 C0
     *  4.8236E+04   00 90 A7 37  76 8D E7 40
     *  2.3179E+04   00 90 52 8F  A5 A2 D6 40
     * 
     *  7.3803E+00   5E 18 21 E2  6E 85 1D 40
     * -5.1673E+00   AA 6D 7B 37  54 AB 14 C0
     * -2.5413E+00   DC E2 9A 63  9B 54 04 C0
     * 
     *  2.9867E-01   4A 39 78 DC  6F 1D D3 3F
     * -7.3580E-02   F2 EF EF 8E  1D D6 B2 BF
     *  8.0370E-01   89 B7 56 A7  DF B7 E9 3F
     *  5.0937E-01   75 17 5E 1A  BC 4C E0 3F
     * 
     *  4.2494E-11   D4 25 D6 FA  6F 5C C7 3D
     * -1.3598E-10   00 00 1D 3B  69 B0 E2 BD
     * -5.7604E-05   46 37 91 57  87 33 0E BF
     */
    objects.get(402).group.position.set(-7.0792E+04, 4.8236E+04, 2.3179E+04);
    objects.get(402).group.rotation.setFromQuaternion(new THREE.Quaternion(2.9867E-01, -7.3580E-02, 8.0370E-01, 5.0937E-01));
    scene.add(objects.get(402).group);



    // DIDYMOS

    /**
     *     -658030   92 F5 F5 FF
     * 
     *  7.2882E+07   57 E3 6D 7A  5F 60 91 41
     *  1.5587E+07   F0 6F F6 21  FF BA 6D 41
     *  8.7648E+06   78 A1 7F 6D  AA B7 60 41
     * 
     * -5.2855E+00   B0 53 51 DB  64 24 15 C0
     *  3.4044E+00   38 B6 20 9E  3F 3C 0B 40
     *  3.1951E+00   C7 3F 4C A4  A9 8F 09 40
     * 
     * -8.2851E-01   94 6C 48 51  2F 83 EA BF
     * -5.3685E-01   85 23 6A 0F  E0 2D E1 BF
     * -1.4061E-01   9C D0 E0 C8  67 FF C1 BF
     *  7.4744E-02   C8 0D 2C 77  71 22 B3 3F
     * 
     *  0.0000E+00   00 00 00 00  00 00 00 00
     *  3.3881E-21   00 00 00 00  00 00 B0 3B
     * -7.7227E-04   7D CC C8 4B  44 4E 49 BF
     */
    objects.get(-658030).group.position.set(7.2882E+07, 1.5587E+07, 8.7648E+06);
    objects.get(-658030).group.rotation.setFromQuaternion(new THREE.Quaternion(-8.2851E-01, -5.3685E-01, -1.4061E-01, 7.4744E-02));
    scene.add(objects.get(-658030).group);



    // DIMORPHOS

    /**
     * NOTE: There was no data available for dimorphos at the given time.
     */
    objects.get(-658031).group.position.set(7.2882E+07 + 1, 1.5587E+07, 8.7648E+06);
    scene.add(objects.get(-658031).group);



    // HERA
    
    /**
     *      -91000   88 9C FE FF
     * 
     *  0.0000E+00   00 00 00 00  00 00 00 00
     *  0.0000E+00   00 00 00 00  00 00 00 00
     *  0.0000E+00   00 00 00 00  00 00 00 00
     * 
     *  0.0000E+00   00 00 00 00  00 00 00 00
     *  0.0000E+00   00 00 00 00  00 00 00 00
     *  0.0000E+00   00 00 00 00  00 00 00 00
     * 
     * -4.1667E-01   3E F7 DB 7E  BC AA DA BF
     * -3.9962E-01   EF 47 B6 A4  6C 93 D9 BF
     *  8.1776E-02   16 3D F7 B2  4A EF B4 3F
     *  8.1240E-01   1F 29 4F 8B  35 FF E9 3F
     * 
     * -6.3448E-06   AF 69 96 7A  A5 9C DA BE
     *  2.3975E-06   28 DB 7D 86  A1 1C C4 3E
     *  7.9467E-05   D2 E1 6B 42  EB D4 14 3F
     */
    objects.get(-91000).group.position.set(0, 0, 0);
    objects.get(-91000).group.rotation.setFromQuaternion(new THREE.Quaternion(-4.1667E-01, -3.9962E-01, 8.1776E-02, 8.1240E-01));
    scene.add(objects.get(-91000).group);



    // JUVENTAS
    
    /**
     *   -15513000   58 4A 13 FF
     * 
     * -1.1518E-03   FD F3 10 B3  E6 DE 52 BF
     *  6.0178E-04   47 05 E4 32  14 B8 43 3F
     *  9.9444E-04   E4 D1 AF 5D  FF 4A 50 3F
     * 
     * -3.4268E-08   53 5B 25 D9  CC 65 62 BE
     * -3.6214E-08   C3 79 A9 1C  33 71 63 BE
     * -1.7775E-08   3E 64 41 96  16 16 53 BE
     * 
     * -5.7721E-01   DF B0 33 D8  7A 78 E2 BF
     *  1.2055E-02   52 E4 B1 7A  1B B0 88 3F
     *  6.3228E-01   9E 23 FF 78  A4 3B E4 3F
     *  5.1663E-01   70 3C B9 9C  3E 88 E0 3F
     * 
     *  2.3975E-06   15 DB 7D 86  A1 1C C4 3E
     *  6.3448E-06   AC 69 96 7A  A5 9C DA 3E
     *  7.9467E-05   D1 E1 6B 42  EB D4 14 3F
     */
    objects.get(-15513000).group.position.set(-1.1518E-03, 6.0178E-04, 9.9444E-04);
    objects.get(-15513000).group.rotation.setFromQuaternion(new THREE.Quaternion(-5.7721E-01, 1.2055E-02, 6.3228E-01, 5.1663E-01));
    scene.add(objects.get(-15513000).group);



    // MILANI

    /**
     *    -9102000   50 1D 75 FF
     * 
     * -1.0378E-03   64 90 D1 08  FD 00 51 BF
     *  1.2649E-03   41 50 76 4D  73 B9 54 3F
     *  2.2979E-05   40 89 28 66  73 18 F8 3E
     * 
     *  2.5511E-08   E3 34 57 05  49 64 5B 3E
     *  2.0424E-08   60 8B AB 73  17 EE 55 3E
     *  2.7898E-08   CE 64 4D 4A  90 F4 5D 3E
     * 
     * -5.7721E-01   DF B0 33 D8  7A 78 E2 BF
     *  1.2055E-02   52 E4 B1 7A  1B B0 88 3F
     *  6.3228E-01   9E 23 FF 78  A4 3B E4 3F
     *  5.1663E-01   70 3C B9 9C  3E 88 E0 3F
     * 
     *  2.3975E-06   15 DB 7D 86  A1 1C C4 3E  
     *  6.3448E-06   AC 69 96 7A  A5 9C DA 3E
     *  7.9467E-05   D1 E1 6B 42  EB D4 14 3F
     */
    objects.get(-9102000).group.position.set(-1.0378E-03, 1.2649E-03, 2.2979E-05);
    objects.get(-9102000).group.rotation.setFromQuaternion(new THREE.Quaternion(-5.7721E-01, 1.2055E-02, 6.3228E-01, 5.1663E-01));
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

export async function gsapCamera() {
    objects.get(lastObjectId).group.visible = true;
    lastObjectId = ctrl.getObjectId();

    ctrl.setSimulationDateTo(ctrl.simulationTime, ctrl.simulationRunning);

    const startTime = Date.now();

    while (objects.get(ctrl.getObjectId()).group.position.x !== 0 && Date.now() - startTime < 1000) {
        await new Promise(resolve => requestAnimationFrame(resolve));
    }

    moveCamera();
}
function moveCamera() {
    const object = objects.get(ctrl.getObjectId());

    cameraControls.enabled = false;
    cameraControls.target = object.group.position;
    cameraControls.minDistance = object.cameraRadius * 1.05;
    cameraControls.maxDistance = objects.get(10).cameraRadius * 2500;
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
        cameraControls.maxDistance = objects.get(10).cameraRadius * 2500;
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
                    show(lastObjectId);
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
            console.warn('Camera not found!');
            break;
    }
}

export function hide(id) {
    if(objects.get(id).group.visible) objects.get(id).group.visible = false;
}

export function show(id) {
    if(!objects.get(id).group.visible) objects.get(id).group.visible = true;
}

export function animate() {
    if(ctrl.simulationRunning) {
        data.removeOutDatedTelemetryData();
        data.requestTelemetryData();
        data.updateObjectStates();
        ctrl.updateSimulationTime();
    }
    cameraControls.update();
    renderer.render(scene, currentCamera);
    labelRenderer.render(scene, currentCamera);
    requestAnimationFrame(animate);
}