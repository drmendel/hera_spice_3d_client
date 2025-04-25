//import { webSocketUrl } from "./config";
import * as data from "./spice"
import { getTimeString } from "./controls";
import * as ctrl from "./controls";

export let webSocket = null;
export let shouldwebSocketBeAvailable = true;
export let disconnectionTime = 0;

let webSocketUrl = "ws://localhost:8080";

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

            webSocket.onmessage = wsOnMessage;
            webSocket.onerror = (err) => {
                console.error('WebSocket error:', err);
                reject(new Error('WebSocket failed to open'));
            };

            webSocket.onclose = wsOnClose;
        } else {
            console.log('webSocket is already open or in the process of opening.');
            resolve(webSocket); // If already open, resolve immediately
        }
    });
}


let sentMessages = new Array();

/**
 * Sends a message through webSocket and waits for a response.
 * @param {string} message - Message to send.
 * @returns {Promise<string>} - Resolves with the server response.
 */
export function sendMessage(message) {
    if(!webSocket || webSocket.readyState !== webSocket.OPEN) {
        console.log(webSocket);
        console.log(webSocket.readyState);
        console.log(webSocket.OPEN);
        console.error('webSocket is not open. Cannot send message.');
        return;
    }
    webSocket.send(message);
}


/**
 * Creates a binary message based on the given paramaters.
 * @param {number} utcTimestamp - double
 * @param {number} mode - uint8 
 * @param {number} observerId - int32
 * @returns {ArrayBuffer}
 */
export function createMessage(utcTimestamp, mode, observerId) {
    const message = new ArrayBuffer(13);
    const view = new DataView(message);

    view.setFloat64(0, utcTimestamp, true); // 8 bytes for the date
    view.setUint8(8, mode.charCodeAt(0)); // 1 byte for the mode
    view.setUint32(9, observerId, true); // 4 bytes for the observerId
    
    //console.log('Sending message:', utcTimestamp, mode.charCodeAt(0), observerId);

    sentMessages.push({
        utcTimestamp: utcTimestamp,
        mode: mode
    });

    return message;
}

/**
 * Closes the webSocket connection manually.
 */
export function closewebSocket() {
    if (webSocket) {
        webSocket.close();
        console.log('webSocket connection closed');
    } else {
        console.log('webSocket is not open, cannot close');
    }
}




function wsOnClose() {
    console.log('webSocket connection closed');
}

function printHex(message) {
    const view = new DataView(message);
    let hexString = '';
    for (let i = 0; i < message.byteLength; i++) {
        hexString += view.getUint8(i).toString(16).padStart(2, '0') + ' ';
    }
    console.log(hexString.trim());
}


async function wsOnMessage(event) {
    if (ctrl.oldRequestBlocker) {
        if(data.telemetryData.requestedSize === 0)
        {
            ctrl.oldRequestBlockerStore(false);
            data.telemetryData.reset();
            setTimeout(() => {
                ctrl.changeObserver();
            }, 500);
            setTimeout(() => {
                ctrl.toggleLoading();
            }, 1000);
        }
    }

    const view = new DataView(event.data);

    const timestamp = view.getFloat64(0, true); // 8 bytes for the date
    const date = new Date(timestamp * 1000); // 8 bytes for the date
    const mode = view.getUint8(8); // 1 byte for the mode

    //console.log(timestamp, date, mode);
    //printHex(event.data);

    switch (mode) {
        case 105: // 'i' character as a numeric value
            if(ctrl.lightTimeAdjustment) return;   // Dont process if the data doesnt match the current mode
            //console.log('Server sent instantenous message for date: ', getTimeString(date));
            break;
        case 108: // 'l' character as a numeric value
            if(!ctrl.lightTimeAdjustment) return;   // Dont process if the data doesnt match the current mode
            //console.log('Server sent lighttime-adjusted message for date: ', getTimeString(date));
            break;
        case 101: // 'e' character as a numeric value
            //console.log('Server sent error message for date: ', getTimeString(date));
            const index = sentMessages.findIndex(msg => msg.utcTimestamp === timestamp);
            if (index !== -1) sentMessages.splice(index, 1);
            return;
        default:
            console.log('Unknown mode:', mode);
            return;
    }

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
        case 105:   // 'i' character as a numeric value
        case 108:   // 'l' character as a numeric value
            data.telemetryData.pushBackTimestampData(timestampData);
            data.telemetryData.requestedSize--;
            break;
        default:
            console.error('Unhandled mode:', mode);
            data.telemetryData.requestedSize--;
            break;
    }
    //console.log('Received message:', timestampData);
}


export function requestDataFromServer() {
    if(!webSocket || webSocket.readyState !== webSocket.OPEN) {
        console.error('webSocket is not open. Cannot request data.');
        return;
    }
    if(ctrl.oldRequestBlocker) {
        return;
    }
    const baseDate = data.telemetryData.size ? ctrl.simulationTime : new Date();
    for(let i = data.telemetryData.requestedSize; i < data.telemetryData.maxSize; i++) {
        const date = baseDate.getTime() / 1000 + i * ctrl.speedValues[ctrl.speedLevel - 1];
        const mode = ctrl.lightTimeAdjustment ? 'l' : 'i';
        const requestMessage = createMessage(date, mode, ctrl.observerId);
        webSocket.send(requestMessage);
        data.telemetryData.addRequest(1);
        console.log('Request sent to server: ', new Date(date * 1000));
        //printHex(requestMessage);
    }
}