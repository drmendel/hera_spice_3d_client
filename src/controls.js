// ###################### GLOBAL VARIABLES ######################

import * as conf from "./config";

export let observerId = -91000;             // default observer id: Hera
export let simulationBaseTime = new Date(); // local time

export let realBaseTime = new Date();       // local time
export let speedLevel = 1;

export let simulationRunning = true;
export let lightTimeAdjustment = false;
export let firstPersonView = false;
export let labelDisplay = false;
export let telemetryDisplay = false;
export let startFieldDisplay = false;
export let helpDisplay = false;

export const speedValues = [
  1,        //  1 [second]
  2,        //  2 [second]
  30,       // 30 [second]
  60,       //  1 [minute]
  1800,     // 30 [minute]
  3600,     //  1 [hour]
  21600,    //  6 [hour]
  86400,    //  1 [day] 
  604800,   //  1 [week]
  2629800   //  1 [month]
];

const timeInputElement = document.getElementById('time-input');

// ###################### SETUP ######################

setParamsFromURL();
updatePlaybackButton();
updatePlaceholder();
updateSpeed();

// ###################### LISTENERS ######################

setInterval(updatePlaceholder, 7);
timeInputElement.addEventListener('change', () => setSimulationTime(String(timeInputElement.value)));
document.getElementById('playback-button').addEventListener('mousedown', toggleSimulationRunning);
document.getElementById('playback-speed-input').addEventListener('change', setSpeed);
document.getElementById('increment-button').addEventListener('mousedown', () => crementSpeed(true));
document.getElementById('decrement-button').addEventListener('mousedown', () => crementSpeed(false));

document.getElementById('menu-button').addEventListener('mousedown', toggleMenu);

document.getElementById('full-screen-button').addEventListener('mousedown', toggleFullscreen);
document.getElementById('light-time-adjustment-button').addEventListener('mousedown', toggleLightTimeAdjustment);
document.getElementById('first-person-view-button').addEventListener('mousedown', toggleFirstPersonView);
document.getElementById('label-visibility-button').addEventListener('mousedown', toggleLabelVisibility);
document.getElementById('data-visibility-button').addEventListener('mousedown', toggleTelemetryVisibility);
document.getElementById('startfield-visibility-button').addEventListener('mousedown', toggleStartFieldVisibility);
document.getElementById('help-button').addEventListener('mousedown', toggleHelpDisplay);

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

  const simulationTime = simulationBaseTime.getTime() + scaledTime;

  // Stop simulation if the computed time exceeds conf.maxDate
  if (simulationTime > conf.maxDate.getTime()) setSimulationTime();
  return new Date(simulationTime);  // Return the computed simulation time as a Date object
}




function getTimeString(time) {
  const year = time.getFullYear();  // Use getFullYear() to get the full year
  const month = String(time.getMonth() + 1).padStart(2, '0'); // Ensure two digits
  const day = String(time.getDate()).padStart(2, '0');
  const hours = String(time.getHours()).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const seconds = String(time.getSeconds()).padStart(2, '0');

  if(speedLevel >= 3) return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  const milliseconds = String(time.getMilliseconds()).padStart(3, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;
}

function setSimulationTime(dateString) {
  if (!dateString) {
    simulationBaseTime = new Date(conf.minDate);
  } else {
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
    simulationBaseTime = new Date(Math.max(conf.minDate.getTime(), Math.min(parsedDate.getTime(), conf.maxDate.getTime())));
  }

  setRealBaseTime();
  timeInputElement.value = "";
  timeInputElement.blur();
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
function setParamsFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  
  const timestampParam = urlParams.get('timestamp');
  const observerIdParam = urlParams.get('observerId');

  simulationBaseTime = timestampParam ? new Date(timestampParam) : new Date();
  setRealBaseTime();
  observerId = observerIdParam ? parseInt(observerIdParam, 10) : -91000;
  if(timestampParam && observerIdParam) simulationRunning = false;  // stop the simulation in that point

  const url = new URL(window.location);
  url.search = ''; // Clear all query parameters

  // Update the browser's URL to the new one without query parameters
  window.history.replaceState({}, '', url);
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
function updatePlaceholder() {
  if (simulationRunning) {
    timeInputElement.placeholder = getTimeString(getSimulationTime());  // Pass the timestamp to getTimeString
  }
}

/**
 * Toggles the state of the `simulationRunning` variable.
 * If `simulationRunning` is true, it sets it to false, indicating the simulation is stopped.
 * If `simulationRunning` is false, it sets it to true, indicating the simulation is running.
 */
function toggleSimulationRunning() {
  simulationRunning = simulationRunning ? false : true;
  updatePlaybackButton();
}
/**
 * Updates the text content of the playback button based on the `simulationRunning` state.
 * If the simulation is running, the button text will show "Pause".
 * If the simulation is stopped, the button text will show "Play".
 */
function updatePlaybackButton() {
  document.getElementById('playback-button').textContent = simulationRunning ? "Pause" : "Play";
}

function updateSpeed() {
  document.getElementById('playback-speed-input').value = String(speedLevel);
}

function setSpeed() {
  const psi = document.getElementById('playback-speed-input');
  if (!psi) return;

  const speed = Math.min(10, Math.max(1, Number(psi.value)));
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
function crementSpeed(increment) {
  const psi = document.getElementById('playback-speed-input');
  if (!psi) return;

  // Update speed level
  psi.value = Math.min(10, Math.max(1, Number(psi.value) + (increment ? 1 : -1)));

  // Preserve the correct simulation time before updating speed
  const elapsedSimTime = getSimulationTime(); // This returns a Date object

  // Update speed and timing references
  speedLevel = Number(psi.value);
  simulationBaseTime = new Date(elapsedSimTime.getTime());  // Preserve the current simulation time
  realBaseTime = new Date();  // Use Date object for consistency
}







/**
 * Spice Observer List
*/





/**
 * Toggles the visibility of elements inside the `.controls` container.
 * This function adds or removes the `hidden` class to each element inside `.controls`,
 * effectively showing or hiding the control elements.
 */
function toggleMenu() {
  document.querySelectorAll('.controls *').forEach(el => el.classList.toggle('hidden'));
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
  firstPersonView = !firstPersonView;
  updateFirstPersonViewButton();
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
 * - Flips the `startFieldDisplay` boolean between true and false.
 * - Calls `updateStartFieldVisibilityButton` to update the button's appearance.
 */
function toggleStartFieldVisibility() {
  startFieldDisplay = !startFieldDisplay;
  updateStartFieldVisibilityButton();
}

/**
 * Updates the appearance of the start field visibility button.
 * - Changes the button's border and text color based on `startFieldDisplay` state.
 */
function updateStartFieldVisibilityButton() {
  const btn = document.getElementById('startfield-visibility-button');
  if (!btn) return;
  const color = startFieldDisplay ? conf.lightColor : conf.darkColor;
  btn.style.borderColor = color;
  btn.style.color = color;
}

/**
 * Toggles the help display setting.
 * - Flips the `helpDisplay` boolean between true and false.
 * - Calls `updateHelpButton` to update the button's appearance.
 */
function toggleHelpDisplay() {
  helpDisplay = !helpDisplay;
  updateHelpButton();
}

/**
 * Updates the appearance of the help button.
 * - Changes the button's border and text color based on `helpDisplay` state.
 */
function updateHelpButton() {
  const btn = document.getElementById('help-button');
  if (!btn) return;
  const color = helpDisplay ? conf.lightColor : conf.darkColor;
  btn.style.borderColor = color;
  btn.style.color = color;
}
