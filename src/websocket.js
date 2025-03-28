import { websocketUrl } from "./config";

export let websocket = null;
export let shouldWebSocketBeAvailable = false;
export let websocketError = false;
let disconnectionTime = 0;
let reconnectTimeout = null;

/**
 * Opens a WebSocket connection if it's closed and should be available.
 */
export function openWebSocket() {
    if (!websocket || websocket.readyState === WebSocket.CLOSED) {
        shouldWebSocketBeAvailable = true;
        websocket = new WebSocket(websocketUrl);

        websocket.onopen = () => {
            console.log(`Connected to ${websocketUrl}`);
        };

        websocket.onmessage = async (event) => {
            if (event.data instanceof Blob) {
                const buffer = await event.data.arrayBuffer(); // Convert Blob to ArrayBuffer
                console.log('Received binary data:\n', new Uint8Array(buffer));
            } else {
                console.log('Received message:', event.data);
            }
        };

        websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
            websocketError = true;
        };

        websocket.onclose = (event) => {
            disconnectionTime = Date.now();
            console.log('WebSocket connection closed', event);
            if (shouldWebSocketBeAvailable) handleDisconnection();
        };
    } else {
        console.log('WebSocket is already open or in the process of opening.');
    }
}

/**
 * Sends a message through WebSocket and waits for a response.
 * @param {string} message - Message to send.
 * @returns {Promise<string>} - Resolves with the server response.
 */
export function sendMessage(message) {
    return new Promise((resolve, reject) => {
        if (websocket && websocket.readyState === WebSocket.OPEN) {
            websocket.send(message);
            console.log('Message sent:', message);

            const messageHandler = (event) => {
                resolve(event.data);
                websocket.removeEventListener("message", messageHandler); // Remove listener after first response
            };

            websocket.addEventListener("message", messageHandler);
        } else {
            reject('WebSocket is not open');
        }
    });
}

/**
 * Closes the WebSocket connection manually.
 */
export function closeWebSocket() {
    if (websocket) {
        websocket.close();
        console.log('WebSocket connection closed manually');
    } else {
        console.log('WebSocket is not open, cannot close');
    }
}

/**
 * Handles WebSocket disconnection and attempts to reconnect.
 * If disconnected for too long, logs an error and stops reconnect attempts.
 */
function handleDisconnection() {
    const timeSinceDisconnection = Date.now() - disconnectionTime;

    if (timeSinceDisconnection > 5000) { // 5 seconds threshold
        console.error('WebSocket server is not available. Connection lost for too long.');
        shouldWebSocketBeAvailable = false;
    } else {
        console.log('Reconnecting WebSocket...');
        reconnectTimeout = setTimeout(() => {
            if (!websocket || websocket.readyState === WebSocket.CLOSED) {
                openWebSocket(); // Try to reconnect after a delay
            }
        }, 1000); // Retry after 1 second
    }
}
