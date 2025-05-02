// ###################### GLOBAL VARIABLES ######################

const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
const host = window.location.host; // e.g., mywebsite.com

export let webSocketUrl = `${protocol}://${host}/ws/`;
export const requestPerSec = 10;     // req/sec
export const canvasName = 'threeCanvas';
export const lightColor = 'rgb(175,175,175)';
export const darkColor = 'rgb(128,128,128)';
export const minDate = new Date("2024-10-07T23:58:51.818Z"); // Minimum allowed date
export const maxDate = new Date("2028-01-01T00:00:00.000Z"); // Maximum allowed date
