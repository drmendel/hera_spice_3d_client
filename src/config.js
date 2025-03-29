// ###################### GLOBAL VARIABLES ######################

export let websocketUrl;
export let requestPerSec = 10;     // req/sec
export let lightColor = 'rgb(175,175,175)';
export let darkColor = 'rgb(128,128,128)';

// ###################### FUNCTION ######################

export async function load() {
    const response = await fetch('config.json');
    const configData = await response.json();
    websocketUrl = `ws://${configData.wsDomain}:${configData.wsPort}`;
}