import { Vector3, Quaternion } from "three";
import { TimestampData, instantaneousTelemetryData, lightTimeAdjustedTelemetryData } from "./data";
import { setParamsFromURL, changeObserver, simulationRunningStore, setSimulationDateTo, updatePlaceholder } from "./controls";
import { webSocketUrl, minDate } from "./config";

// ─────────────────────────────────────────────
// WebSocket Management
// ─────────────────────────────────────────────

export let webSocket = null;
let shouldWebSocketBeAvailable = true;
let userAlerted = false;

export function openWebSocket() {
    return new Promise((resolve, reject) => {
        if(webSocket && webSocket.readyState !== webSocket.CLOSED) return resolve(webSocket);

        shouldWebSocketBeAvailable = true;

        webSocket = new WebSocket(webSocketUrl);
        webSocket.binaryType = 'arraybuffer';

        webSocket.onopen = () => {
            console.log('WebSocket connected');
            userAlerted = false;
            resolve(webSocket);
        };

        webSocket.onerror = reject;
        webSocket.onmessage = wsOnMessage;
        webSocket.onclose = wsOnClose;
    });
}

// ─────────────────────────────────────────────
// WebSocket Functions
// ─────────────────────────────────────────────

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
        if(!userAlerted) {
            alert("Websocket server unreachable. Attempting reconnection...");
            console.log('Connection to server interrupted. Attempting reconnection...');
            userAlerted = true;
        }
        setTimeout(wsReconnection, 5000);
    }
}

function wsReconnection() {
    openWebSocket().then(() => {
        if(webSocket?.readyState === WebSocket.OPEN) {
            setParamsFromURL();
        }
    });
}

async function wsOnMessage(event) {
    const binData = event.data;

    if (!(binData instanceof ArrayBuffer) || binData.byteLength < 9) return;
    
    const view = new DataView(binData);
    
    const timestamp = view.getFloat64(0, true); // 8 bytes for the date
    const date = new Date(timestamp * 1000); // 8 bytes for the date
    const mode = view.getUint8(8); // 1 byte for the mode
    
    const timestampData = new TimestampData(date);
    
    let offset = 9;

    while (offset < event.data.byteLength) {
        // Read object ID (Int32 = 4 bytes)
        const id = view.getInt32(offset, true);
        offset += 4;

        // Read Position (3 x Float64 = 24 bytes)
        const position = new Vector3(
            view.getFloat64(offset, true),
            view.getFloat64(offset + 8, true),
            view.getFloat64(offset + 16, true)
        );
        offset += 24;

        // Read Velocity (3 x Float64 = 24 bytes)
        const velocity = new Vector3(
            view.getFloat64(offset, true),
            view.getFloat64(offset + 8, true),
            view.getFloat64(offset + 16, true)
        );
        offset += 24;

        // Read Quaternion (4 x Float64 = 32 bytes)
        const quaternion = new Quaternion(
            view.getFloat64(offset, true),
            view.getFloat64(offset + 8, true),
            view.getFloat64(offset + 16, true),
            view.getFloat64(offset + 24, true)
        );
        offset += 32;

        // Read Angular Velocity (3 x Float64 = 24 bytes)
        const angularVelocity = new Vector3(
            view.getFloat64(offset, true),
            view.getFloat64(offset + 8, true),
            view.getFloat64(offset + 16, true)
        );
        offset += 24;

        timestampData.addObjectData(id, position, velocity, quaternion, angularVelocity);
    }

    switch (mode) {
        case 105: // 'i' character as a numeric value
            instantaneousTelemetryData.pushBackTimestampData(timestampData);
            break;
        case 108: // 'l' character as a numeric value
            lightTimeAdjustedTelemetryData.pushBackTimestampData(timestampData);
            break;
        case 101: // 'e' character as a numeric value
            break;
        case 102: // 'f' char instantError
            instantaneousTelemetryData.requestedSize--;
            if(!fallbackToMinDate) {
                fallbackToMinDate = true;
                changeObserver(-91000);
                simulationRunningStore(false);
                await setSimulationDateTo(minDate);
                updatePlaceholder();
            }
            break;
        case 103: // 'g' char lightError
            lightTimeAdjustedTelemetryData.requestedSize--;
            if(!fallbackToMinDate) {
                fallbackToMinDate = true;
                changeObserver(-91000);
                simulationRunningStore(false);
                await setSimulationDateTo(minDate);
                updatePlaceholder();
            }
            break;
        default:
            console.error('Unknown mode:', mode);
            if(instantaneousTelemetryData.requestedSize !== 0) instantaneousTelemetryData.requestedSize--;
            if(lightTimeAdjustedTelemetryData.requestedSize !== 0) lightTimeAdjustedTelemetryData.requestedSize--;
            break;
    }
}

export function sendMessage(utcTimestamp, mode, observerId) {
    if(!webSocket || webSocket.readyState !== webSocket.OPEN) {
        console.error("WebSocket is not open. Cannot send message.");
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
    view.setUint8(8, mode.charCodeAt(0));   // 1 byte for the mode
    view.setUint32(9, id, true);            // 4 bytes for the observerId

    return message;
}

// ─────────────────────────────────────────────
// Websocket Ping Mechanism
// ─────────────────────────────────────────────

setInterval(() => {
    if (shouldWebSocketBeAvailable) {
        if(!webSocket || webSocket.readyState !== webSocket.OPEN) return;
        webSocket.send("ping");
    }
}, 15000);

// ─────────────────────────────────────────────
// Fallback to Min Date
// ─────────────────────────────────────────────

export let fallbackToMinDate = false;
export function setFallBackToMinDate(bool) {
    fallbackToMinDate = bool;
}