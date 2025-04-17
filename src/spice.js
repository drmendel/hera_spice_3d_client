/*
 *  _______  _____  _____ _______ _______      ______  _______ _______ _______
 *  |______ |_____]   |   |       |______      |     \ |_____|    |    |_____|
 *  ______| |       __|__ |_____  |______      |_____/ |     |    |    |     |
 *
*/

import * as THREE from "three";

/**
 * Mapping of three.js groups to their respective spice identifiers.
 * These represent celestial bodies and spacecraft in the CSPICE system.
 */
export let objects = new Map([
    [0, { name: "SOLAR SYSTEM BARYCENTER", cameraRadius: 0, group: new THREE.Group() }],
    [10, { name: "SUN", cameraRadius: 696340, group: new THREE.Group() }],
    [199, { name: "MERCURY", cameraRadius: 2439.7, group: new THREE.Group() }],
    [299, { name: "VENUS", cameraRadius: 6051.8, group: new THREE.Group() }],
    [399, { name: "EARTH", cameraRadius: 6378, group: new THREE.Group() }],
    [301, { name: "MOON", cameraRadius: 1737.4, group: new THREE.Group() }],
    [499, { name: "MARS", cameraRadius: 3389.5, group: new THREE.Group() }],
    [401, { name: "PHOBOS", cameraRadius: 13.1, group: new THREE.Group() }],
    [402, { name: "DEIMOS", cameraRadius: 6.2, group: new THREE.Group() }],
    [-658030, { name: "DIDYMOS", cameraRadius: 0.780, group: new THREE.Group() }],
    [-658031, { name: "DIMORPHOS", cameraRadius: 0.085, group: new THREE.Group() }],

    [-91900, { name: "DART IMPACT SITE", cameraRadius: 0, group: new THREE.Group() }],                              // this is just a point
    [-91000, { name: "HERA SPACECRAFT", cameraRadius: 0.0065, group: new THREE.Group() }],
    [-15513000, { name: "JUVENTAS SPACECRAFT", cameraRadius: 0.002, group: new THREE.Group() }],
    [-9102000, { name: "MILANI SPACECRAFT", cameraRadius: 0.002, group: new THREE.Group() }]
]);

const hshAspect = 2018 / 1088;
const afcAspect = 1024 / 1024;
const jncAspect = 2048 / 1536;
const mncAspect = 2048 / 1536;

/**
 * Mapping of HERA spacecraft camera identifiers to their names.
 * These represent the available cameras in the simulation:
 *  - one general camera called DEFAULT
 *  - different camera systems on the HERA spacecraft
 */
export const cameras = new Map([
    [0, { name: "DEFAULT", aspect: 1, camera: new THREE.PerspectiveCamera(45, 1, 1E-6, 1E12) }],
    [-91400, { name: "HSH", aspect: hshAspect, camera: new THREE.PerspectiveCamera(9.9, hshAspect, 2.5E-3, 1E12)}],    // HyperScout Hyperspectral
    [-91120, { name: "AFC2", aspect: afcAspect, camera: new THREE.PerspectiveCamera(5.5, afcAspect, 2.5E-3, 1E12)}],   // Asteroid Framing Camera 2
    [-91110, { name: "AFC1", aspect: afcAspect, camera: new THREE.PerspectiveCamera(5.5, afcAspect, 2.5E-3, 1E12)}],   // Asteroid Framing Camera 1
    [-15513310, { name: "JNC", aspect: jncAspect, camera: new THREE.PerspectiveCamera(28.5, jncAspect, 2.5E-3, 1E12)}], // Juventas Navigation Camera
    [-9102310, { name: "MNC", aspect: mncAspect, camera: new THREE.PerspectiveCamera(16, mncAspect, 2.5E-3, 1E12)}]  // Milani Navigation Camera
]);

/* 
    HERA_SPACECRAFT (-91000)*    HERA_LGA+X (-91071)*
    HERA_SA+Y (-91011)*          HERA_LGA-X (-91072)*
    HERA_SA-Y (-91015)*          HERA_AFC-1 (-91110)*
    HERA_STR-OH1 (-91061)*       HERA_AFC-2 (-91120)*
    HERA_STR-OH2 (-91062)*       HERA_TIRI (-91200)*
    HERA_JUVENTAS_IFP (-91063)*  HERA_PALT (-91300)*
    HERA_MILANI_IFP (-91064)*    HERA_HSH (-91400)*
    HERA_HGA (-91070)*           HERA_SMC (-91500)*

    JUVENTAS_SPACECRAFT (-15513000)*  JUVENTAS_JURA-Y (-15513114)*
    JUVENTAS_SA+Y (-15513011)*        JUVENTAS_GRASS+X (-15513210)*
    JUVENTAS_SA-Y (-15513015)*        JUVENTAS_GRASS+Z (-15513220)*
    JUVENTAS_ISL+X (-15513071)*       JUVENTAS_NAVCAM (-15513310)*
    JUVENTAS_ISL-X (-15513072)*       JUVENTAS_LIDAR (-15513410)*
    JUVENTAS_JURA+X (-15513111)*      JUVENTAS_STR-1 (-15513510)*
    JUVENTAS_JURA-X (-15513112)*      JUVENTAS_STR-2 (-15513520)*
    JUVENTAS_JURA+Y (-15513113)*      JUVENTAS_CCAM (-15513610)*

    MILANI_SPACECRAFT (-9102000)*   MILANI_NAVCAM (-9102310)*
    MILANI_SA+Y (-9102011)*         MILANI_LIDAR (-9102410)*
    MILANI_SA-Y (-9102015)*         MILANI_MLRH_1 (-9102511)*
    MILANI_ASPECT_VIS (-9102110)*   MILANI_MLRH_2 (-9102512)*
    MILANI_ASPECT_NIR1 (-9102120)*  MILANI_STR (-9102610)*
    MILANI_ASPECT_NIR2 (-9102130)*  MILANI_ILS+X (-9102711)*
    MILANI_ASPECT_SWIR (-9102140)*  MILANI_ILS-X (-9102712)*
    MILANI_VISTA (-9102210)*
*/
