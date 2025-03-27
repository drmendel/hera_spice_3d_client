// ###################### GLOBAL VARIABLES ######################

export let observerId = -91000;             // default observer id: Hera
export let simulationBaseTime = new Date(); // local time

export let realBaseTime = new Date();       // local time
export let simulationSpeedLevel = 1;

export let simulationRunning = true;
export let lightTimeAdjustment = false;
export let firstPersonView = false;
export let labelDisplay = false;
export let telemetryDisplay = false;
export let startFieldDisplay = false;
export let helpDisplay = false;

export let touchScreen = false;

// ###################### LOCAL VARIABLES ######################

const lightColor = 'rgb(175,175,175)';
const darkColor = 'rgb(128,128,128)';

// ###################### DATA FUNCTIONS ######################

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
  observerId = observerIdParam ? parseInt(observerIdParam, 10) : -91000;


  const url = new URL(window.location);
  url.search = ''; // Clear all query parameters

  // Update the browser's URL to the new one without query parameters
  window.history.replaceState({}, '', url);
}

/**
 * Updates `realBaseTime` to the given timestamp or the current local timestamp.
 * If a `date` argument is provided, it will be used to set `realBaseTime`. 
 * Otherwise, the current time (`new Date()`) will be used.
 * 
 * @param {Date} [date] Optional. If provided, sets `realBaseTime` to this value.
 */
function setRealBaseTime(date) {
  if (date instanceof Date && !isNaN(date)) realBaseTime = date;
  else realBaseTime = new Date();
}

/**
 * Returns the real elapsed time in seconds since the start of the simulation.
 * The elapsed time is calculated based on the realLocalTimestamp of the 
 * simulation start and the current local timestamp: `new Date()`.
 * 
 * @return {number} The real elapsed time in seconds since the simulation started.
 */
function getRealElapsedTime() {
  const elapsedTime = 0;
  return elapsedTime;
}

// ###################### UI FUNCTIONS ######################

/** 
 * TIME INPUT FUNCTION
*/

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



/**
 * Updates the animation speed based on the value of the playback speed input.
 * - Ensures the value stays within a valid range (1 to 10).
 * - Updates the `simulationSpeedLevel` variable.
 * - Logs the updated value to the console.
 */
function setSpeed() {
  const psi = document.getElementById('playback-speed-input');
  if (!psi) return;
  psi.value = Math.min(10, Math.max(1, psi.value));
  simulationSpeedLevel = Number(psi.value);
}

/**
 * Increments or decrements the playback speed.
 * - `increment` (boolean): If true, increases speed; otherwise, decreases it.
 * - Ensures the speed stays within the range (1 to 10).
 */
function crementSpeed(increment) {
  const psi = document.getElementById('playback-speed-input');
  if (!psi) return;
  psi.value = Math.min(10, Math.max(1, Number(psi.value) + (increment ? 1 : -1)));
  simulationSpeedLevel = Number(psi.value);
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

  const color = isFullscreen ? lightColor : darkColor;
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
  const color = lightTimeAdjustment ? lightColor : darkColor;
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
  const color = firstPersonView ? lightColor : darkColor;
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
  const color = labelDisplay ? lightColor : darkColor;
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
  const color = telemetryDisplay ? lightColor : darkColor;
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
  const color = startFieldDisplay ? lightColor : darkColor;
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
  const color = helpDisplay ? lightColor : darkColor;
  btn.style.borderColor = color;
  btn.style.color = color;
}

// ###################### SETUP ######################

setParamsFromURL();
updatePlaybackButton();

// ###################### LISTENERS ######################

document.getElementById('playback-button').addEventListener('click', toggleSimulationRunning);
document.getElementById('playback-speed-input').addEventListener('change', setSpeed);
document.getElementById('increment-button').addEventListener('click', () => crementSpeed(true));
document.getElementById('decrement-button').addEventListener('click', () => crementSpeed(false));

document.getElementById('menu-button').addEventListener('click', toggleMenu);

document.getElementById('full-screen-button').addEventListener('click', toggleFullscreen);
document.getElementById('light-time-adjustment-button').addEventListener('click', toggleLightTimeAdjustment);
document.getElementById('first-person-view-button').addEventListener('click', toggleFirstPersonView);
document.getElementById('label-visibility-button').addEventListener('click', toggleLabelVisibility);
document.getElementById('data-visibility-button').addEventListener('click', toggleTelemetryVisibility);
document.getElementById('startfield-visibility-button').addEventListener('click', toggleStartFieldVisibility);
document.getElementById('help-button').addEventListener('click', toggleHelpDisplay);