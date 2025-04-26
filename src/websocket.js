import * as data from "./data"
//import { webSocketUrl } from "./config";
let webSocketUrl = "ws://localhost:8081";

let webSocket = null;
let shouldwebSocketBeAvailable = true;

/**
 * Opens a webSocket connection if it's closed and should be available.
 */
export function openWebSocket() {
    return new Promise((resolve, reject) => {
        if (!webSocket || webSocket.readyState === webSocket.CLOSED) {
            shouldwebSocketBeAvailable = true;

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
    const message = new ArrayBuffer(13);
    const view = new DataView(message);

    view.setFloat64(0, utcTimestamp, true); // 8 bytes for the date
    view.setUint8(8, mode.charCodeAt(0)); // 1 byte for the mode
    view.setUint32(9, observerId, true); // 4 bytes for the observerId
    
    return message;
}

export function closewebSocket() {
    if (webSocket) {
        shouldwebSocketBeAvailable = false;
        webSocket.close();
    }
    else console.log('webSocket is not open, cannot close');
}

function wsOnClose() {
    webSocket = null;
    if(shouldwebSocketBeAvailable) wsReconnection();
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
        const position = new data.Vector(
            view.getFloat64(offset, true),
            view.getFloat64(offset + 8, true),
            view.getFloat64(offset + 16, true)
        );
        offset += 24;

        // Read Velocity (3 x Float64 = 24 bytes)
        const velocity = new data.Vector(
            view.getFloat64(offset, true),
            view.getFloat64(offset + 8, true),
            view.getFloat64(offset + 16, true)
        );
        offset += 24;

        // Read Quaternion (4 x Float64 = 32 bytes)
        const quaternion = new data.Quaternion(
            view.getFloat64(offset, true),
            view.getFloat64(offset + 8, true),
            view.getFloat64(offset + 16, true),
            view.getFloat64(offset + 24, true)
        );
        offset += 32;

        // Read Angular Velocity (3 x Float64 = 24 bytes)
        const angularVelocity = new data.Vector(
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
            console.error('Server has no data for timestamp:', date);
            break;
        default:
            console.error('Unknown mode:', mode);
            break;
    }
}
