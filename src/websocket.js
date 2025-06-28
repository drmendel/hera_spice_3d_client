import {
    toggleSimulationRunning,
    simulationRunningStore,
    setSimulationDateTo,
    updatePlaceholder,
    changeObserver
} from "./controls";

import {
    lightTimeAdjustedTelemetryData,
    instantaneousTelemetryData,
    TimestampData
} from "./data";

import { webSocketUrl, minDate } from "./config";
import { Vector3, Quaternion } from "three";



// ─────────────────────────────────────────────
// Setter for fallbackToMinDate
// ─────────────────────────────────────────────
export let fallbackToMinDate = false;
export function setFallBackToMinDate(value) {
    fallbackToMinDate = value;
}



// ─────────────────────────────────────────────
// WebSocket Open
// ─────────────────────────────────────────────

let userAlerted = false;
export let webSocket = null;

export async function openWebSocket() {
    if (!webSocket || webSocket.readyState === WebSocket.CLOSED) {
        shouldWebSocketBeAvailable = true;
        webSocket = new WebSocket(webSocketUrl);
        webSocket.binaryType = 'arraybuffer';

        return new Promise((resolve, reject) => {
            webSocket.onopen = () => {
                userAlerted = false;
                resolve(webSocket);
            };
            webSocket.onerror = () => reject();
            webSocket.onmessage = wsOnMessage;
            webSocket.onclose = wsOnClose;
        });
    }
    return webSocket;
}



// ─────────────────────────────────────────────
// WebSocket Connection Keepalive
// ─────────────────────────────────────────────

let shouldWebSocketBeAvailable = true;
const PING_INTERVAL_MS = 15000;

setInterval(() => {
    if (shouldWebSocketBeAvailable && webSocket?.readyState === WebSocket.OPEN) {
        webSocket.send("ping");
    }
}, PING_INTERVAL_MS);



// ─────────────────────────────────────────────
// Send Message
// ─────────────────────────────────────────────

export function sendMessage(utcTimestamp, mode, observerId) {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
        console.error('webSocket is not open. Cannot send message.');
        return;
    }
    webSocket.send(createMessage(utcTimestamp, mode, observerId));
}

function createMessage(utcTimestamp, mode, observerId) {
    let id = (() => {
        switch(observerId) {
            case -91400:
            case -91120:
            case -91110: return -91000;
            case -15513310: return -15513000;
            case -9102310: return -9102000;
            default: return observerId;
        }
    })();

    const message = new ArrayBuffer(13);
    const view = new DataView(message);

    view.setFloat64(0, utcTimestamp, true);
    view.setUint8(8, mode.charCodeAt(0));
    view.setUint32(9, id, true);

    return message;
}



// ─────────────────────────────────────────────
// Close WebSocket
// ─────────────────────────────────────────────

export function closeWebSocket() {
    if (webSocket) {
        shouldWebSocketBeAvailable = false;
        webSocket.close();
    } else {
        console.warn('webSocket is not open, cannot close');
    }
}



// ─────────────────────────────────────────────
// WebSocket Event Handlers
// ─────────────────────────────────────────────

function wsOnClose() {
    webSocket = null;

    if (shouldWebSocketBeAvailable) {
        if (!userAlerted) {
            console.log('Connection to server interrupted. Attempting reconnection...');
            userAlerted = true;
        }
        setTimeout(wsReconnection, 5000);
    }
}

async function wsOnMessage(event) {
    const binData = event.data;
    if (!(binData instanceof ArrayBuffer) || binData.byteLength < 9) return;

    const view = new DataView(binData);

    const timestamp = view.getFloat64(0, true);
    const date = new Date(timestamp * 1000);
    const mode = view.getUint8(8);

    const timestampData = new TimestampData(date);
    let offset = 9;

    while (offset < binData.byteLength) {
        const id = view.getInt32(offset, true); offset += 4;

        const position = new Vector3(
            view.getFloat64(offset, true),
            view.getFloat64(offset + 8, true),
            view.getFloat64(offset + 16, true)
        );
        offset += 24;

        const velocity = new Vector3(
            view.getFloat64(offset, true),
            view.getFloat64(offset + 8, true),
            view.getFloat64(offset + 16, true)
        );
        offset += 24;

        const quaternion = new Quaternion(
            view.getFloat64(offset, true),
            view.getFloat64(offset + 8, true),
            view.getFloat64(offset + 16, true),
            view.getFloat64(offset + 24, true)
        );
        offset += 32;

        const angularVelocity = new Vector3(
            view.getFloat64(offset, true),
            view.getFloat64(offset + 8, true),
            view.getFloat64(offset + 16, true)
        );
        offset += 24;

        timestampData.addObjectData(id, position, velocity, quaternion, angularVelocity);
    }

    switch (mode) {
        case 105: // 'i'
            instantaneousTelemetryData.pushBackTimestampData(timestampData);
            break;
        case 108: // 'l'
            lightTimeAdjustedTelemetryData.pushBackTimestampData(timestampData);
            break;
        case 101: // 'e'
            break;
        case 102: // 'f' instantError
        case 103: // 'g' lightError
            if (!fallbackToMinDate) {
                fallbackToMinDate = true;
                changeObserver(-91000);
                simulationRunningStore(false);
                await setSimulationDateTo(minDate);
                updatePlaceholder();
            }
            if (mode === 102) instantaneousTelemetryData.requestedSize--;
            else if (mode === 103) lightTimeAdjustedTelemetryData.requestedSize--;
            break;
        default:
            console.error('Unknown mode:', mode);
            if (instantaneousTelemetryData.requestedSize !== 0) instantaneousTelemetryData.requestedSize--;
            if (lightTimeAdjustedTelemetryData.requestedSize !== 0) lightTimeAdjustedTelemetryData.requestedSize--;
            break;
    }
}



// ─────────────────────────────────────────────
// WebSocket Connection Handlers
// ─────────────────────────────────────────────

export function waitForOpen(timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
        const start = Date.now();

        (function check() {
            if (webSocket?.readyState === WebSocket.OPEN) resolve();
            else if (Date.now() - start > timeoutMs) reject(new Error("WebSocket did not open in time"));
            else setTimeout(check, 1000);
        })();
    });
}

export async function wsReconnection() {
    await openWebSocket();
    if (webSocket?.readyState === WebSocket.OPEN) {
        simulationRunningStore(true);
        toggleSimulationRunning();
    }
}