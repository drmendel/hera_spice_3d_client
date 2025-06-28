import {
    observerId,
    speedLevel,
    speedValues,
    updateTable,
    simulationTime,
    firstPersonView,
    simulationRunning,
    lightTimeAdjustment,
} from "./controls.js";

import {
    Group,
    Vector3,
    Quaternion,
    PerspectiveCamera,
} from "three";

import {
    hide,
    show,
    updateSecondaryObjectVisibility
} from "./animation.js";

import { sendMessage } from "./websocket.js";
import { requestPerSec } from "./config.js";
  

/**
 * Mapping of three.js groups to their respective spice identifiers.
 * These represent celestial bodies and spacecraft in the CSPICE system.
 */
export let objects = new Map([
    [0, { name: "SOLAR SYSTEM BARYCENTER", cameraRadius: 0, group: new Group() }],
    [10, { name: "SUN", cameraRadius: 696340, group: new Group() }],
    [199, { name: "MERCURY", cameraRadius: 2439.7, group: new Group() }],
    [299, { name: "VENUS", cameraRadius: 6051.8, group: new Group() }],
    [399, { name: "EARTH", cameraRadius: 6378, group: new Group() }],
    [301, { name: "MOON", cameraRadius: 1737.4, group: new Group() }],
    [499, { name: "MARS", cameraRadius: 3389.5, group: new Group() }],
    [401, { name: "PHOBOS", cameraRadius: 14, group: new Group() }],
    [402, { name: "DEIMOS", cameraRadius: 8, group: new Group() }],
    [-658030, { name: "DIDYMOS", cameraRadius: 0.780, group: new Group() }],
    [-658031, { name: "DIMORPHOS", cameraRadius: 0.170, group: new Group() }],

    [-91900, { name: "DART IMPACT SITE", cameraRadius: 0, group: new Group() }],                              // this is just a point
    [-91000, { name: "HERA SPACECRAFT", cameraRadius: 0.0065, group: new Group() }],
    [-15513000, { name: "JUVENTAS SPACECRAFT", cameraRadius: 0.002, group: new Group() }],
    [-9102000, { name: "MILANI SPACECRAFT", cameraRadius: 0.002, group: new Group() }]
]);

const hshAspect = 2018 / 1088;
const afcAspect = 1024 / 1024;
const jncAspect = 2048 / 1536;
const mncAspect = 2048 / 1536;

// A camera field of view (FOV) mapping for different spacecraft cameras.

export const cameraFOVs = new Map([
    [0, 50],
    [-91400, 9.9],
    [-91120, 5.5],
    [-91110, 5.5],
    [-15513310, 28.5],
    [-9102310, 16]
]);

/**
 * Mapping of HERA spacecraft camera identifiers to their names.
 * These represent the available cameras in the simulation:
 *  - one general camera called DEFAULT
 *  - different camera systems on the HERA spacecraft
 * 
 *  The fov properties may change when the browser window is resized.
 *  Whe should use the cameraFOVs map instread.
 */
export const cameras = new Map([
    [0, {
      name: "DEFAULT",
      aspect: 1,
      camera: new PerspectiveCamera(50, 1, 1e-6, 1e12),
    }],
    [-91400, {
      name: "HSH", // HyperScout Hyperspectral
      aspect: hshAspect,
      camera: new PerspectiveCamera(9.9, hshAspect, 0.1, 1e12),
    }],
    [-91120, {
      name: "AFC2", // Asteroid Framing Camera 2
      aspect: afcAspect,
      camera: new PerspectiveCamera(5.5, afcAspect, 0.1, 1e12),
    }],
    [-91110, {
      name: "AFC1", // Asteroid Framing Camera 1
      aspect: afcAspect,
      camera: new PerspectiveCamera(5.5, afcAspect, 0.1, 1e12),
    }],
    [-15513310, {
      name: "JNC", // Juventas Navigation Camera
      aspect: jncAspect,
      camera: new PerspectiveCamera(28.5, jncAspect, 0.1, 1e12),
    }],
    [-9102310, {
      name: "MNC", // Milani Navigation Camera
      aspect: mncAspect,
      camera: new PerspectiveCamera(16, mncAspect, 0.1, 1e12),
    }],
  ]);
  

/* 
    SPICE IDENTIFIERS FOR HERA, JUVENTAS, MILANI SPACECRAFTS AND THEIR INSTRUMENTS

    HERA_SPACECRAFT (-91000)*    HERA_LGA+X (-91071)*
    HERA_SA+Y (-91011)*          HERA_LGA-X (-91072)*
    HERA_SA-Y (-91015)*          HERA_AFC-1 (-91110)*
    HERA_STR-OH1 (-91061)*       HERA_AFC-2 (-91120)*
    HERA_STR-OH2 (-91062)*       HERA_TIRI (-91200)*
    HERA_JUVENTAS_IFP (-91063)*  HERA_PALT (-91300)*
    HERA_MILANI_IFP (-91064)*    HERA_HSHDART (-91400)*
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

export class ObjectData {
    constructor(position, velocity, quaternion, angularVelocity) {
        this.position = new Vector3(position.x, position.y, position.z); 
        this.velocity = new Vector3(velocity.x, velocity.y, velocity.z);
        this.quaternion = new Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
        this.angularVelocity = new Vector3(angularVelocity.x, angularVelocity.y, angularVelocity.z);
    }
}

export class TimestampData {
    constructor(date) {
        this.date = date;
        this.objects = new Map();
    }
    addObjectData(id, position, velocity, quaternion, angularVelocity) {
        this.objects.set(id, new ObjectData(position, velocity, quaternion, angularVelocity));
    }
}

export class TelemetryData {
    constructor() {
        this.maxSize = 3;
        this.requestedSize = 0;
        this.array = [];
    }
    pushBackTimestampData(timeStampData) {
        for (let i = 0; i < this.array.length; i++) {
            if (this.array[i].date > timeStampData.date) {
                this.array.splice(i, 0, timeStampData);
                this.requestedSize--;
                return;
            }
        }
        this.array.push(timeStampData);
        this.requestedSize--;
    }
    popFrontTimestampData() {
        if (this.array.length > 0) {
            this.array.shift();
        }
    }
    addRequest(requestNumber) {
        this.requestedSize += requestNumber;
    }
    removeRequest(requestNumber) {
        this.requestedSize -= requestNumber;
    }
    getRequestedSize() {
        return this.requestedSize;
    }
    reset() {
        this.array.length = 0;
        this.requestedSize = 0;
    }
}

export let instantaneousTelemetryData = new TelemetryData();
export let lightTimeAdjustedTelemetryData = new TelemetryData();
export let deltaT = 1 / requestPerSec;    // sec

export function removeOutDatedTelemetryData() {
    while (instantaneousTelemetryData.array.length > 2 && instantaneousTelemetryData.array[1].date.getTime() < simulationTime.getTime()) {
        instantaneousTelemetryData.popFrontTimestampData();
    }
    while (lightTimeAdjustedTelemetryData.array.length > 2 && lightTimeAdjustedTelemetryData.array[1].date.getTime() < simulationTime.getTime()) {
        lightTimeAdjustedTelemetryData.popFrontTimestampData();
    }
}

function sendRequest(data, mode) {
    if(data.requestedSize === 0 && data.array.length === 0) {
        const time = simulationTime.getTime() / 1000;
        sendMessage(time, mode, observerId);
        data.requestedSize++;
    }
}

function sendRequests(data, mode) {
    const speed = speedValues[speedLevel - 1] * deltaT;
    const missing = data.maxSize - (data.array.length + data.requestedSize);
    for (let i = 0; i < missing; i++) {
        const time = simulationTime.getTime() / 1000 + (data.array.length + i) * speed;
        sendMessage(time, mode, observerId);
        data.requestedSize++;
    }
};

async function waitForMessages() {
  while (instantaneousTelemetryData.requestedSize !== 0 || lightTimeAdjustedTelemetryData.requestedSize !== 0) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

export function requestTelemetryData() {
    if(!simulationRunning) {
        waitForMessages().then(() => {
            sendRequest(instantaneousTelemetryData, 'i');
            sendRequest(lightTimeAdjustedTelemetryData, 'l');
        });
    }
    else {
        waitForMessages().then(() => {
            sendRequests(instantaneousTelemetryData, 'i');
            sendRequests(lightTimeAdjustedTelemetryData, 'l');
        });
    }
}

let tlmUpdated = false;

export function updateObjectStates() {
    const telemetryData = lightTimeAdjustment ? lightTimeAdjustedTelemetryData : instantaneousTelemetryData;
    
    if(telemetryData.array.length < 1) return;
    
    if(telemetryData.array.length === 1) {
        const data = telemetryData.array[0];
        for (const [id, object] of objects) {
            const obj = data.objects.get(id);
            if (!obj) {
                if(id !== 0) hide(id);     // skip starField (SOLAR_SYSTEM_BARYCENTER)
                continue;
            }
            
            object.group.position.copy(obj.position);
            if(id === 0) continue;              // skip starField (SOLAR_SYSTEM_BARYCENTER)
            object.group.quaternion.copy(obj.quaternion);

            if(firstPersonView && id === observerId) continue;    // if we are in FPV, skip the current observer 
            if(id === -9102000 || id === -15513000) {
                const distance = objects.get(id).group.position.distanceTo(objects.get(-91000).group.position);
                if(distance < 0.002) {
                    hide(id);
                    continue;
                }
            }
            if(updateSecondaryObjectVisibility(id)) continue;
            show(id);                      // skip starField (SOLAR_SYSTEM_BARYCENTER)
        }

        if(!tlmUpdated) {
            updateTable();
            tlmUpdated = true;
        }
        
        return;
    }

    if(tlmUpdated) tlmUpdated = false;
    updateTable();

    const data0 = telemetryData.array[0];
    const data1 = telemetryData.array[1];

    for (const [id, object] of objects) {
        const obj0 = data0.objects.get(id);
        const obj1 = data1.objects.get(id);

        if (!obj0 || !obj1) {
            if(id !== 0) hide(id);     // skip starField (SOLAR_SYSTEM_BARYCENTER)
            continue;
        }

        object.group.position.copy(hermitePosition(
            data0.date, obj0.position, obj0.velocity,
            data1.date, obj1.position, obj1.velocity,
            simulationTime
        ));

        if(id === 0) continue;              // skip starField (SOLAR_SYSTEM_BARYCENTER)
        object.group.quaternion.copy(slerpRotation(
            data0.date, obj0.quaternion,
            data1.date, obj1.quaternion,
            simulationTime
        ));

        if(firstPersonView && id === observerId) continue;    // if we are in FPV, skip the current observer 
        if(id === -9102000 || id === -15513000) {
            const distance = objects.get(id).group.position.distanceTo(objects.get(-91000).group.position);
            if(distance < 0.002) {
                hide(id);
                continue;
            }
        }
        if(updateSecondaryObjectVisibility(id)) continue;
        show(id);
    }
}



let tmpVector = new Vector3();

function hermitePosition(time0, position0, velocity0, time1, position1, velocity1, simulationTime) {
    const t0 = time0.getTime();
    const t1 = time1.getTime();
    const ts = simulationTime.getTime();
    const duration = (t1 - t0) / 1000;
    const t = (ts - t0) / (t1 - t0);

    const h00 = 2 * t ** 3 - 3 * t ** 2 + 1;
    const h10 = t ** 3 - 2 * t ** 2 + t;
    const h01 = -2 * t ** 3 + 3 * t ** 2;
    const h11 = t ** 3 - t ** 2;

    return tmpVector.set(
        h00 * position0.x + h10 * velocity0.x * duration + h01 * position1.x + h11 * velocity1.x * duration,
        h00 * position0.y + h10 * velocity0.y * duration + h01 * position1.y + h11 * velocity1.y * duration,
        h00 * position0.z + h10 * velocity0.z * duration + h01 * position1.z + h11 * velocity1.z * duration
    );
}

function slerpRotation(time0, quaternion0, time1, quaternion1, simulationTime) {
    const t0 = time0.getTime();
    const t1 = time1.getTime();
    const ts = simulationTime.getTime();
    const t = (ts - t0) / (t1 - t0);

    return new Quaternion().slerpQuaternions(quaternion0, quaternion1, t);
}
