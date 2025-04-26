// ###################### GLOBAL VARIABLES ######################

export let webSocketUrl;
export const requestPerSec = 10;     // req/sec
export const canvasName = 'threeCanvas';
export const lightColor = 'rgb(175,175,175)';
export const darkColor = 'rgb(128,128,128)';
export const minDate = new Date("2024-08-01T00:00:00.000"); // Minimum allowed date
export const maxDate = new Date("2029-01-01T00:00:00.000"); // Maximum allowed date

// ###################### FUNCTION ######################

export async function load() {
    const response = await fetch('config.json');
    const configData = await response.json();
    webSocketUrl = `ws://${configData.wsDomain}:${configData.wsPort}`;
}