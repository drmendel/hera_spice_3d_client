import {
    lightTimeAdjustment,
    simulationRunning,
    firstPersonView,
    simulationTime,
    updateTable,
    speedValues,
    observerId,
    speedLevel
} from "./controls.js";

import {
    PerspectiveCamera,
    Quaternion,
    Vector3,
    Group,
} from "three";

import {
    updateSecondaryObjectVisibility,
    show,
    hide
} from "./animation.js";

import { sendMessage } from "./websocket.js";
import { requestPerSec } from "./config.js";



// ─────────────────────────────────────────────
// Objects and Cameras Setup
// ─────────────────────────────────────────────

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

    [-91900, { name: "DART IMPACT SITE", cameraRadius: 0, group: new Group() }],
    [-91000, { name: "HERA SPACECRAFT", cameraRadius: 0.0065, group: new Group() }],
    [-15513000, { name: "JUVENTAS SPACECRAFT", cameraRadius: 0.002, group: new Group() }],
    [-9102000, { name: "MILANI SPACECRAFT", cameraRadius: 0.002, group: new Group() }]
]);

const hshAspect = 2018 / 1088;
const afcAspect = 1024 / 1024;
const jncAspect = 2048 / 1536;
const mncAspect = 2048 / 1536;

export const cameraFOVs = new Map([
    [0, 50],
    [-91400, 9.9],
    [-91120, 5.5],
    [-91110, 5.5],
    [-15513310, 28.5],
    [-9102310, 16]
]);

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



// ─────────────────────────────────────────────
// Data Structures
// ─────────────────────────────────────────────

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



// ─────────────────────────────────────────────
// Telemetry Handling Functions
// ─────────────────────────────────────────────

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



// ─────────────────────────────────────────────
// Object State Update
// ─────────────────────────────────────────────

let tlmUpdated = false;

export function updateObjectStates() {
    const telemetryData = lightTimeAdjustment ? lightTimeAdjustedTelemetryData : instantaneousTelemetryData;
    
    if(telemetryData.array.length < 1) return;
    
    if(telemetryData.array.length === 1) {
        const data = telemetryData.array[0];
        for (const [id, object] of objects) {
            const obj = data.objects.get(id);
            if (!obj) {
                if(id !== 0) hide(id);                              // skip starField (SOLAR_SYSTEM_BARYCENTER)
                continue;
            }
            
            object.group.position.copy(obj.position);
            if(id === 0) continue;                                  // skip starField (SOLAR_SYSTEM_BARYCENTER)
            object.group.quaternion.copy(obj.quaternion);

            if(firstPersonView && id === observerId) continue;      // if we are in FPV, skip the current observer 
            if(id === -9102000 || id === -15513000) {
                const distance = objects.get(id).group.position.distanceTo(objects.get(-91000).group.position);
                if(distance < 0.002) {
                    hide(id);
                    continue;
                }
            }
            if(updateSecondaryObjectVisibility(id)) continue;
            show(id);                                               // skip starField (SOLAR_SYSTEM_BARYCENTER)
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
            if(id !== 0) hide(id);                                  // skip starField (SOLAR_SYSTEM_BARYCENTER)
            continue;
        }

        object.group.position.copy(hermitePosition(
            data0.date, obj0.position, obj0.velocity,
            data1.date, obj1.position, obj1.velocity,
            simulationTime
        ));

        if(id === 0) continue;                                      // skip starField (SOLAR_SYSTEM_BARYCENTER)
        object.group.quaternion.copy(slerpRotation(
            data0.date, obj0.quaternion,
            data1.date, obj1.quaternion,
            simulationTime
        ));

        if(firstPersonView && id === observerId) continue;          // if we are in FPV, skip the current observer 
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
