// ###################### GLOBAL VARIABLES ######################

import * as engine from "./animation";
import * as conf from "./config";
import * as data from './data';
import * as ws from './websocket';

export let observerId = -91000;             // default observer id: Hera
export let simulationBaseTime = new Date(); // local time
export let simulationTime = new Date();
export let realBaseTime = new Date();       // local time
export let speedLevel = 1;
const maxLevel = 12;
const minLevel = 1;

export let simulationRunning = true;
export let lightTimeAdjustment = false;
export let firstPersonView = false;
export let labelDisplay = false;
export let telemetryDisplay = false;
export let starFieldDisplay = true;
export let infoDisplay = false;
export let framesVisible = false;

export const speedValues = [
  1,        //  1 [second]
  2,        //  2 [second]
  15,       // 15 [second]
  30,       // 30 [second]
  60,       //  1 [minute]
  900,      // 15 [minute]
  1800,     // 30 [minute]
  3600,     //  1 [hour]
  21600,    //  6 [hour]
  86400,    //  1 [day] 
  604800,   //  1 [week]
  2629800   //  1 [month]
];



// ##################### SETUP ##########################

const timeInputElement = document.getElementById('time-input');

export function setup() {

  // General
  
  setParamsFromURL();
  updatePlaybackButton();
  updateSpeed();
  updateStarFieldVisibilityButton();

  // Listeners 

  setInterval(updatePlaceholder, 7);
  setInterval(hideUnavailableOptions, data.deltaT);

  timeInputElement.addEventListener('change', () => setSimulationTime(String(timeInputElement.value)));
  document.getElementById('playback-button').addEventListener('mousedown', toggleSimulationRunning);
  document.getElementById('playback-speed-input').addEventListener('change', setSpeed);
  document.getElementById('increment-button').addEventListener('mousedown', () => crementSpeed(true));
  document.getElementById('decrement-button').addEventListener('mousedown', () => crementSpeed(false));
  document.getElementById('observer-dropdown').addEventListener('change', event => {changeObserver(event.target.value)});

  document.getElementById('menu-button').addEventListener('mousedown', toggleMenu);

  document.getElementById('full-screen-button').addEventListener('mousedown', toggleFullscreen);
  document.getElementById('first-person-view-button').addEventListener('mousedown', toggleFirstPersonView);
  document.getElementById('ambient-light-button').addEventListener('mousedown', toggleAmbientLight);
  document.getElementById('starfield-visibility-button').addEventListener('mousedown', toggleStarFieldVisibility);
  document.getElementById('label-visibility-button').addEventListener('mousedown', toggleLabelVisibility);
  document.getElementById('frame-visibility-button').addEventListener('mousedown', toggleFrameVisibility);
  document.getElementById('light-time-adjustment-button').addEventListener('mousedown', toggleLightTimeAdjustment);
  document.getElementById('data-visibility-button').addEventListener('mousedown', toggleTelemetryVisibility);
  document.getElementById('info-button').addEventListener('mousedown', toggleInfoDisplay);
}



// ###################### DATA FUNCTIONS ######################

/**
 * Calculates the current simulation time based on elapsed real-world time.
 * - Computes the elapsed time since `realBaseTime` in milliseconds.
 * - Scales the elapsed time by the current speed factor.
 * - Returns the updated simulation time as a `Date` object.
 * - Stops the simulation if the computed simulation time exceeds `conf.maxDate`.
 *
 * @returns {Date} The computed simulation time as a Date object.
 */
export function getSimulationTime() {
  const elapsedTime = new Date() - realBaseTime;  // Elapsed time in milliseconds
  const scaledTime = elapsedTime * speedValues[speedLevel - 1];  // Scaled elapsed time

  simulationTime = new Date(simulationBaseTime.getTime() + scaledTime);

  // Stop simulation if the computed time exceeds conf.maxDate
  if (simulationTime.getTime() > conf.maxDate.getTime()) setSimulationDateTo(conf.minDate, false);
  return simulationTime;  // Return the computed simulation time as a Date object
}




function getTimeString(time) {
  const year = time.getUTCFullYear();  // Use getFullYear() to get the full year
  const month = String(time.getUTCMonth() + 1).padStart(2, '0'); // Ensure two digits
  const day = String(time.getUTCDate()).padStart(2, '0');
  const hours = String(time.getUTCHours()).padStart(2, '0');
  const minutes = String(time.getUTCMinutes()).padStart(2, '0');
  const seconds = String(time.getUTCSeconds()).padStart(2, '0');

  if(speedLevel >= 3) return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
  const milliseconds = String(time.getUTCMilliseconds()).padStart(3, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
}

export function setSimulationTime(dateString) {
  timeInputElement.value = "";
  timeInputElement.blur();
  
  if (!dateString) setSimulationDateTo(new Date(conf.minDate.getTime(), simulationRunning));
  else {
    const defaultParts = ["0000", "01", "01", "00", "00", "00", "000"];
    const parts = dateString.split(/[-T:.]/);

    // Fill missing parts with defaults
    for (let i = 0; i < defaultParts.length; i++) {
      parts[i] = parts[i] || defaultParts[i];
    }

    let fullDateString = `${parts[0].padStart(4, "0")}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}` +
        `T${parts[3].padStart(2, "0")}:${parts[4].padStart(2, "0")}:${parts[5].padStart(2, "0")}.${parts[6].padStart(3, "0")}`;

    let parsedDate = new Date(fullDateString);

    if (isNaN(parsedDate.getTime())) {
      console.error("Invalid date, using minimum date instead.");
      parsedDate = new Date(conf.minDate);
    }

    // Ensure the date is within the allowed range
    setSimulationDateTo(new Date(Math.max(conf.minDate.getTime(), Math.min(parsedDate.getTime(), conf.maxDate.getTime()))), simulationRunning);
  }
}

export function simulationRunningStore(bool) {
  simulationRunning = bool;
}

/**
 * Extracts parameters from the URL query string and sets the corresponding variables.
 * - `timestamp`: If provided, sets `simulationBaseTime` to the specified value; 
 *   otherwise, sets it to the current time.
 * - `observerId`: If provided, parses it as an integer and assigns it to `observerId`; 
 *   otherwise, defaults to `-91000` (Hera ID).
 * 
 * This function helps initialize the simulation state based on URL parameters.
 */
export function setParamsFromURL() {
  if(ws.webSocket.readyState !== WebSocket.OPEN) return;
  const urlParams = new URLSearchParams(window.location.search);
  
  const timestampParam = urlParams.get('timestamp');
  const cameraParam = urlParams.get('camera');

  if(!cameraParam || !timestampParam) return;
  simulationRunning = true;
  toggleSimulationRunning();
  const tmpSimulationBaseTime = new Date(timestampParam);
  simulationBaseTime = isNaN(tmpSimulationBaseTime.getTime()) ? new Date() : tmpSimulationBaseTime;
  setRealBaseTime();
  simulationTime = simulationBaseTime;
  updatePlaceholder();

  switch(cameraParam) {
    case "HSH":
      observerId = -91400;
      break;
    case "AFC2":
      observerId = -91120;
      break;
    case "AFC1":
      observerId = -91110;
      break;
    case "JNC":
      observerId = -15513310;
      break;
    case "MNC":
      observerId = -9102310;
      break;
    default:
      observerId = -91000;  //Default to Hera
      break;
  }

  changeObserver(observerId);
}

/**
 * Updates `realBaseTime` to the given timestamp or the current local timestamp.
 * If a valid `date` argument is provided, it will be used; otherwise, the current time is used.
 * 
 * @param {Date} [date] Optional. If provided and valid, sets `realBaseTime` to this value.
 */
function setRealBaseTime(date) {
  if (date instanceof Date && !isNaN(date.getTime())) realBaseTime = date;
  else realBaseTime = new Date;
}

// ###################### UI FUNCTIONS ######################

// Function to update the placeholder with the simulation time
export function updatePlaceholder() {
  timeInputElement.placeholder = getTimeString(simulationTime);  // Pass the timestamp to getTimeString
}

export function updateSimulationTime() {
  simulationTime = getSimulationTime();
}

/**
 * Toggles the state of the `simulationRunning` variable.
 * If `simulationRunning` is true, it sets it to false, indicating the simulation is stopped.
 * If `simulationRunning` is false, it sets it to true, indicating the simulation is running.
 */
export async function toggleSimulationRunning() {
  if(ws.webSocket === null) return; 
  if (ws.webSocket.readyState !== WebSocket.OPEN) return;

  if(simulationRunning) {
    await setSimulationDateTo(simulationTime, false);
  }
  else {
    setRealBaseTime();
    simulationRunning = true;
  }
  updatePlaybackButton();
}

export async function setSimulationDateTo(date, run) {
    simulationRunning = run;
    simulationTime = date;
    simulationBaseTime = simulationTime;
    setRealBaseTime();
    await waitForMessages(() => data.instantaneousTelemetryData.requestedSize, () => data.lightTimeAdjustedTelemetryData.requestedSize);
    data.instantaneousTelemetryData.reset();
    data.lightTimeAdjustedTelemetryData.reset();
    data.requestTelemetryData();
    await waitForMessages(() => data.instantaneousTelemetryData.requestedSize, () => data.lightTimeAdjustedTelemetryData.requestedSize);
    data.updateObjectStates();
    updatePlaceholder();
    if(ws.fallbackToMinDate) ws.setFallBackToMinDate(false);
}

export async function waitForMessages(getA, getB) {
  while (getA() !== 0 || getB() !== 0) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

/**
 * Updates the text content of the playback button based on the `simulationRunning` state.
 * If the simulation is running, the button text will show "Pause".
 * If the simulation is stopped, the button text will show "Play".
 */
export function updatePlaybackButton() {
  document.getElementById('playback-button').textContent = simulationRunning ? "Pause" : "Play";
}

function updateSpeed() {
  document.getElementById('playback-speed-input').value = String(speedLevel);
}

function setSpeed() {
  const psi = document.getElementById('playback-speed-input');
  if (!psi) return;

  const speed = Math.min(maxLevel, Math.max(minLvel, Number(psi.value)));
  psi.value = String(speed);

  // Ensure correct time tracking
  simulationBaseTime = new Date(getSimulationTime().getTime());
  setRealBaseTime();
  speedLevel = speed;
}


/**
 * Increments or decrements the playback speed.
 * - `increment` (boolean): If true, increases speed; otherwise, decreases it.
 * - Ensures the speed stays within the range (1 to 10).
 */
async function crementSpeed(increment) {
  const psi = document.getElementById('playback-speed-input');
  if (!psi) return;
  psi.value = Math.min(maxLevel, Math.max(minLevel, Number(psi.value) + (increment ? 1 : -1)));

  if(!increment) {
    const simulationState = simulationRunning;
    simulationRunning = false;
    await waitForMessages(() => data.instantaneousTelemetryData.requestedSize, () => data.lightTimeAdjustedTelemetryData.requestedSize);
    data.instantaneousTelemetryData.reset();
    data.lightTimeAdjustedTelemetryData.reset();
    simulationRunning = simulationState;
  }

  // Update speed and timing references
  simulationBaseTime = new Date(simulationTime.getTime());  // Preserve the current simulation time
  realBaseTime = new Date();  // Use Date object for consistency
  speedLevel = Number(psi.value);
}







/**
 * Spice Observer List
*/
export function changeObserver(eventTargetValue) {
  observerId = Number(eventTargetValue);
  
  const dropdown = document.getElementById('observer-dropdown');
  if (dropdown.value !== String(observerId)) {
    dropdown.value = observerId;
  }

  if(firstPersonView) toggleFirstPersonView();
  
  if(observerId === -91400 || observerId === -91120 || observerId === -91110 || observerId === -15513310 || observerId === -9102310) {
    engine.changeCamera(observerId);
    document.getElementById('camera-box').style.display = 'block';
  }
  else {
    engine.changeCamera(0); // Default camera
    engine.gsapCamera();
    document.getElementById('camera-box').style.display = 'none';
  }
}





/**
 * Toggles the visibility of elements inside the `.controls` container.
 * This function adds or removes the `hidden` class to each element inside `.controls`,
 * effectively showing or hiding the control elements.
 */
function toggleMenu() {
  document.querySelectorAll('.controls *').forEach(el => el.classList.toggle('hidden'));
  if(infoDisplay) document.getElementById('info-box').classList.toggle('hidden');
}



/**
 * Toggles fullscreen mode for the document.
 * - If not in fullscreen, requests fullscreen for the document element.
 * - If in fullscreen, exits fullscreen mode.
 */
function toggleFullscreen() {
  const isFullscreen = !!document.fullscreenElement;

  if (isFullscreen) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen();
  }

  console.log(data.instantaneousTelemetryData);

  updateFullScreenButton(!isFullscreen);
}
/**
 * Updates the fullscreen button's appearance based on fullscreen state.
 * @param {boolean} isFullscreen - Whether fullscreen mode is active.
 */
function updateFullScreenButton(isFullscreen) {
  const btn = document.getElementById('full-screen-button');

  if (!btn) return; // Avoid errors if button is missing

  const color = isFullscreen ? conf.lightColor : conf.darkColor;
  btn.style.borderColor = color;
  btn.style.color = color;
}



/**
 * Toggles the light time adjustment setting.
 * - Flips the `lightTimeAdjustment` boolean between true and false.
 * - Calls `updateLighTimeAdjustmentButton` to update the button's appearance.
 */
function toggleLightTimeAdjustment() {
  lightTimeAdjustment = !lightTimeAdjustment; // Toggle the boolean value
  updateLighTimeAdjustmentButton();
}
/**
 * Updates the appearance of the light time adjustment button.
 * - Changes the button's border and text color based on `lightTimeAdjustment` state.
 */
function updateLighTimeAdjustmentButton() {
  const btn = document.getElementById('light-time-adjustment-button');
  if (!btn) return;
  const color = lightTimeAdjustment ? conf.lightColor : conf.darkColor;
  btn.style.borderColor = color;
  btn.style.color = color;
}


/**
 * Toggles the light time adjustment setting.
 * - Flips the `firstPersonView` boolean between true and false.
 * - Calls `updateFirstPersonViewButton` to update the button's appearance.
 */
function toggleFirstPersonView() {
  if(observerId === -91400 || observerId === -91110 || observerId === -91120 || observerId === -15513310 || observerId === -9102310) return;
  firstPersonView = !firstPersonView;
  updateFirstPersonViewButton();
  engine.gsapCameraFPV();
}

/**
 * Updates the appearance of the first person view button.
 * - Changes the button's border and text color based on `firstPersonView` state.
 */
function updateFirstPersonViewButton() {
  const btn = document.getElementById('first-person-view-button');
  if (!btn) return;
  const color = firstPersonView ? conf.lightColor : conf.darkColor;
  btn.style.borderColor = color;
  btn.style.color = color;
}



/**
 * Toggles the label visibility setting.
 * - Flips the `labelDisplay` boolean between true and false.
 * - Calls `updateLabelVisibilityButton` to update the button's appearance.
 */
function toggleLabelVisibility() {
  labelDisplay = !labelDisplay;
  engine.toggleLabels();
  updateLabelVisibilityButton();
}

/**
 * Updates the appearance of the label visibility button.
 * - Changes the button's border and text color based on `labelDisplay` state.
 */
function updateLabelVisibilityButton() {
  const btn = document.getElementById('label-visibility-button');
  if (!btn) return;
  const color = labelDisplay ? conf.lightColor : conf.darkColor;
  btn.style.borderColor = color;
  btn.style.color = color;
}

/**
 * Toggles the telemetry visibility setting.
 * - Flips the `telemetryDisplay` boolean between true and false.
 * - Calls `updateTelemetryVisibilityButton` to update the button's appearance.
 */
function toggleTelemetryVisibility() {
  telemetryDisplay = !telemetryDisplay;
  updateTelemetryVisibilityButton();
  const tlmDiv = document.getElementById("telemetry");
  if(telemetryDisplay) tlmDiv.classList.remove("hidden");
  else tlmDiv.classList.add("hidden");
  updateTable();
}

/**
 * Updates the appearance of the telemetry visibility button.
 * - Changes the button's border and text color based on `telemetryDisplay` state.
 */
function updateTelemetryVisibilityButton() {
  const btn = document.getElementById('data-visibility-button');
  if (!btn) return;
  const color = telemetryDisplay ? conf.lightColor : conf.darkColor;
  btn.style.borderColor = color;
  btn.style.color = color;
}

/**
 * Toggles the start field visibility setting.
 * - Flips the `starFieldDisplay` boolean between true and false.
 * - Calls `updateStarFieldVisibilityButton` to update the button's appearance.
 */
function toggleStarFieldVisibility() {
  starFieldDisplay = !starFieldDisplay;
  updateStarFieldVisibilityButton();
  starFieldDisplay ? engine.show(0) : engine.hide(0);
}

/**
 * Updates the appearance of the start field visibility button.
 * - Changes the button's border and text color based on `starFieldDisplay` state.
 */
export function updateStarFieldVisibilityButton() {
  const btn = document.getElementById('starfield-visibility-button');
  if (!btn) return;
  const color = starFieldDisplay ? conf.lightColor : conf.darkColor;
  btn.style.borderColor = color;
  btn.style.color = color;
}

/**
 * Toggles the info display setting.
 * - Flips the `infoDisplay` boolean between true and false.
 * - Calls `updateInfoButton` to update the button's appearance.
 */
function toggleInfoDisplay() {
  infoDisplay = !infoDisplay;
  updateInfoButton();
  updateInfoDisplay();
}

/**
 * Updates the appearance of the info button.
 * - Changes the button's border and text color based on `infoDisplay` state.
 */
function updateInfoButton() {
  const btn = document.getElementById('info-button');
  if (!btn) return;
  const color = infoDisplay ? conf.lightColor : conf.darkColor;
  btn.style.borderColor = color;
  btn.style.color = color;
}

function updateInfoDisplay() {
  if(infoDisplay) document.getElementById('info-box').classList.remove('hidden');
  else document.getElementById('info-box').classList.add('hidden');
}

export function toggleLoading() {
  const spinner = document.getElementById("loading-spinner");
  spinner.style.display = spinner.style.display === "flex" ? "none" : "flex";
}

export function getObjectId(id) {
  const tmpId = id || observerId;
  switch (tmpId) {
    case -91400:
    case -91120:
    case -91110: return -91000;
    case -15513310: return -15513000;
    case -9102310: return -9102000;
    default: return tmpId;
  }
}

export function hideUnavailableOptions() {
  if(ws.webSocket?.readyState === WebSocket.OPEN) {
    document.querySelectorAll('option').forEach(opt => {
      const id = getObjectId(+opt.value);

      const g = (a, i) => data[a].array[i]?.objects.has(id);

      let show = false;
      if(simulationRunning) show = g('instantaneousTelemetryData', 0) && g('instantaneousTelemetryData', 1);
      else show = g('instantaneousTelemetryData', 0);

      /**
       * We only check if instantaneous data is available for the objects.
       * From the observer's perspective, all telemetry is "instantaneous":
       * if lightTimeAdjustment is enabled—because the observer is at the origin.
       * Light-time from [0, 0, 0] to [0, 0, 0] is zero, so adjustment is irrelevant.
      **/

      opt.classList.toggle('hidden', !show);
    });
  }
}

function toggleFrameVisibility() {
  framesVisible = !framesVisible;
  engine.frames.forEach((frame) => {
    frame.visible = !frame.visible;
  });
  updateFrameVisibilityButton();
}

function updateFrameVisibilityButton() {
  const btn = document.getElementById('frame-visibility-button');

  if (!btn) return; // Avoid errors if button is missing

  const color = framesVisible ? conf.lightColor : conf.darkColor;
  btn.style.borderColor = color;
  btn.style.color = color;
}

function toggleAmbientLight() {
  engine.ambientLight.visible = !engine.ambientLight.visible;
  updateAmbientLightButton();
}

function updateAmbientLightButton() {
  const btn = document.getElementById('ambient-light-button');

  if (!btn) return; // Avoid errors if button is missing

  const color = engine.ambientLight.visible ? conf.lightColor : conf.darkColor;
  btn.style.borderColor = color;
  btn.style.color = color;
}

const telemetryTable = document.getElementById("telemetry-table");
const tbody = telemetryTable.querySelector('tbody');

export function updateTable() {
  if(!telemetryDisplay) return;
  if (!tbody) {
    console.error('Error: Table body (tbody) not found!');
    return;
  }

  let tableContent = ''; // String buffer to hold table rows

  const tmpData = lightTimeAdjustment ? data.lightTimeAdjustedTelemetryData : data.instantaneousTelemetryData;
  if (!tmpData?.array?.[0]?.objects || tmpData.array[0].objects.size === 0) return;

  const date = tmpData.array[0].date;
  document.getElementById("date").textContent = date.toISOString();


  // Add the observer at first with bold characters
  const currentOrigo = getObjectId(observerId);
    tableContent += `
    <tr>
      <td>${currentOrigo}</td> 
      <td>${data.objects.get(currentOrigo).name}</td>
      <td>${vec3ToStr(tmpData.array[0].objects.get(currentOrigo).position)}</td>
      <td>${vec3ToStr(tmpData.array[0].objects.get(currentOrigo).velocity)}</td>
      <td>${quatToStr(tmpData.array[0].objects.get(currentOrigo).quaternion)}</td>
      <td>${vec3ToStr(tmpData.array[0].objects.get(currentOrigo).angularVelocity)}</td>
    </tr>
  `;

  tmpData.array[0].objects.forEach((obj, id) => {
    if(id === currentOrigo) return;

    const name = data.objects.get(id)?.name || 'Unknown'; // Safely get name
    const pos = obj.position;
    const vel = obj.velocity;
    const quat = obj.quaternion;
    const angVel = obj.angularVelocity;

    // Build the table row as a string and append to tableContent
    tableContent += `
      <tr>
        <td>${id}</td> 
        <td>${name}</td>
        <td>${vec3ToStr(pos)}</td>
        <td>${vec3ToStr(vel)}</td>
        <td>${quatToStr(quat)}</td>
        <td>${vec3ToStr(angVel)}</td>
      </tr>
    `;
  });

  // Update the table content all at once
  tbody.innerHTML = tableContent;
}

function formatSci(num) {
  const [mantissa, exponent] = num.toExponential(4).split('e');
  return `<span class="mantissa">${mantissa}</span><span class="exp">e${exponent}</span>`;
}

function vec3ToStr(v) {
  return `<table style="margin: 0 auto; text-align: center;">
    <tr><td>${formatSci(v.x)}</td></tr>
    <tr><td>${formatSci(v.y)}</td></tr>
    <tr><td>${formatSci(v.z)}</td></tr>
  </table>`;
}

function quatToStr(q) {
  return `<table style="margin: 0 auto; text-align: center;">
    <tr><td>${formatSci(q.x)}</td></tr>
    <tr><td>${formatSci(q.y)}</td></tr>
    <tr><td>${formatSci(q.z)}</td></tr>
    <tr><td>${formatSci(q.w)}</td></tr>
  </table>`;
}
