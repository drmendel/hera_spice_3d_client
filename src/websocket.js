import * as THREE from "three";
import * as data from "./data";
import * as ctrl from "./controls";
import { webSocketUrl } from "./config";

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
    if(observerId === -91400 || observerId === -91120 || observerId === -91110) id = -91000;
    else if(observerId === -15513310) id = -15513000;
    else if(observerId === -9102310) id = -9102000;
    else id = observerId;

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
    if(shouldWebSocketBeAvailable) wsReconnection();
}

export function wsReconnection() {
    setTimeout(() => {
        openWebSocket()
            .catch(() => {
                console.log('Reconnect failed, trying again...');
                wsReconnection(); // Retry recursively
            });
    }, 1000); // Wait 1 second before retrying
}

function wsOnMessage(event) {
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
            const observer = data.objects.get(ctrl.observerId);
            const observerName = observer ? observer.name : 'UNKNOWN';
            alert(`Insufficient ephemeris data has been loaded to compute the state of objects relative to ${observerName} (${ctrl.observerId}) at the ephemeris epoch ${ctrl.simulationTime}`);            
            break;
        default:
            console.error('Unknown mode:', mode);
            if(data.instantaneousTelemetryData.requestedSize !== 0) data.instantaneousTelemetryData.requestedSize--;
            if(data.lightTimeAdjustedTelemetryData.requestedSize !== 0) data.instantaneousTelemetryData.requestedSize--;
            break;
    }
}
