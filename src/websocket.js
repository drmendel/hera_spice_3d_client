import * as THREE from "three";
import * as data from "./data";
import * as ctrl from "./controls";
import { webSocketUrl, minDate } from "./config";

export let webSocket = null;
let shouldWebSocketBeAvailable = true;

/**
 * Opens a webSocket connection if it's closed and should be available.
 */
export function openWebSocket() {
    return new Promise((resolve, reject) => {
        if (!webSocket || webSocket.readyState === webSocket.CLOSED) {
            shouldWebSocketBeAvailable = true;

            webSocket = new WebSocket(webSocketUrl);
            webSocket.binaryType = 'arraybuffer';

            webSocket.onopen = () => {
                console.log('WebSocket connected');
                resolve(webSocket); // Resolves the promise once the socket is open
            };
            webSocket.onerror = (err) => {
                reject();
            };

            webSocket.onmessage = wsOnMessage;
            webSocket.onclose = wsOnClose;
        } else {
            resolve(webSocket); // If already open, resolve immediately
        }
    });
}

export function sendMessage(utcTimestamp, mode, observerId) {
    if(!webSocket || webSocket.readyState !== webSocket.OPEN) {
        console.error('webSocket is not open. Cannot send message.');
        return;
    }
    webSocket.send(createMessage(utcTimestamp, mode, observerId));
}

function createMessage(utcTimestamp, mode, observerId) {
    let id;
    switch(observerId) {
        case -91400:
        case -91120:
        case -91110:
            id = -91000;
            break;
        case -15513310:
            id = -15513000;
            break;
        case -9102310:
            id = -9102000;
            break;
        default:
            id = observerId;
            break; 
    }

    const message = new ArrayBuffer(13);
    const view = new DataView(message);

    view.setFloat64(0, utcTimestamp, true); // 8 bytes for the date
    view.setUint8(8, mode.charCodeAt(0)); // 1 byte for the mode
    view.setUint32(9, id, true); // 4 bytes for the observerId

    return message;
}

export function closeWebSocket() {
    if (webSocket) {
        shouldWebSocketBeAvailable = false;
        webSocket.close();
    }
    else console.warn('webSocket is not open, cannot close');
}

function wsOnClose() {
    webSocket = null;
    if(shouldWebSocketBeAvailable) {
        console.log('Trying again...');
        setTimeout(wsReconnection, 5000);
    }
}

function wsReconnection() {
    openWebSocket().then(() => {
        if(webSocket?.readyState === WebSocket.OPEN) {
            ctrl.simulationRunningStore(true);
            ctrl.toggleSimulationRunning();
        }
    }).catch(() => {
        // Do nothing
    });
}

async function wsOnMessage(event) {
    const view = new DataView(event.data);
    
    const timestamp = view.getFloat64(0, true); // 8 bytes for the date
    const date = new Date(timestamp * 1000); // 8 bytes for the date
    const mode = view.getUint8(8); // 1 byte for the mode
    
    const timestampData = new data.TimestampData(date);
    
    let offset = 9;

    while (offset < event.data.byteLength) {
        // Read object ID (Int32 = 4 bytes)
        const id = view.getInt32(offset, true);
        offset += 4;

        // Read Position (3 x Float64 = 24 bytes)
        const position = new THREE.Vector3(
            view.getFloat64(offset, true),
            view.getFloat64(offset + 8, true),
            view.getFloat64(offset + 16, true)
        );
        offset += 24;

        // Read Velocity (3 x Float64 = 24 bytes)
        const velocity = new THREE.Vector3(
            view.getFloat64(offset, true),
            view.getFloat64(offset + 8, true),
            view.getFloat64(offset + 16, true)
        );
        offset += 24;

        // Read Quaternion (4 x Float64 = 32 bytes)
        const quaternion = new THREE.Quaternion(
            view.getFloat64(offset, true),
            view.getFloat64(offset + 8, true),
            view.getFloat64(offset + 16, true),
            view.getFloat64(offset + 24, true)
        );
        offset += 32;

        // Read Angular Velocity (3 x Float64 = 24 bytes)
        const angularVelocity = new THREE.Vector3(
            view.getFloat64(offset, true),
            view.getFloat64(offset + 8, true),
            view.getFloat64(offset + 16, true)
        );
        offset += 24;

        timestampData.addObjectData(id, position, velocity, quaternion, angularVelocity);
    }

    switch (mode) {
        case 105: // 'i' character as a numeric value
            data.instantaneousTelemetryData.pushBackTimestampData(timestampData);
            break;
        case 108: // 'l' character as a numeric value
            data.lightTimeAdjustedTelemetryData.pushBackTimestampData(timestampData);
            break;
        case 101: // 'e' character as a numeric value
            break;
        case 102: // 'f' char instantError
            data.instantaneousTelemetryData.requestedSize--;
            if(!fallbackToMinDate) {
                fallbackToMinDate = true;
                ctrl.simulationRunningStore(false);
                await ctrl.setSimulationDateTo(minDate);
                ctrl.updatePlaceholder();
            }
            break;
        case 103: // 'g' char lightError
            data.lightTimeAdjustedTelemetryData.requestedSize--;
            if(!fallbackToMinDate) {
                fallbackToMinDate = true;
                ctrl.simulationRunningStore(false);
                await ctrl.setSimulationDateTo(minDate);
                ctrl.updatePlaceholder();
            } 
            break;
        default:
            console.error('Unknown mode:', mode);
            if(data.instantaneousTelemetryData.requestedSize !== 0) data.instantaneousTelemetryData.requestedSize--;
            if(data.lightTimeAdjustedTelemetryData.requestedSize !== 0) data.instantaneousTelemetryData.requestedSize--;
            break;
    }
}

export function waitForOpen() {
  return new Promise((resolve, reject) => {
    const maxWait = 30*60*1000; // ms
    const start = Date.now();

    const check = () => {
      if (webSocket?.readyState === WebSocket.OPEN) {
        resolve();
      } else if (Date.now() - start > maxWait) {
        reject(new Error("WebSocket did not open in time"));
      } else {
        setTimeout(check, 1000);
      }
    };

    check();
  });
}

export let fallbackToMinDate = false;
export function setFallBackToMinDate(bool) {
    fallbackToMinDate = bool;
}