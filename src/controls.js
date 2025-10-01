/*
 *  Copyright 2025 Mendel Dobondi-Reisz
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import {
  gsapCameraFPV,
  ambientLight,
  changeCamera,
  toggleLabels,
  gsapCamera,
  frames,
  show,
  hide
} from "./engine";

import {
  minDate,
  maxDate,
  darkColor,
  lightColor
} from "./config";

import {
  lightTimeAdjustedTelemetryData,
  instantaneousTelemetryData,
  requestTelemetryData,
  updateObjectStates,
  objects,
  deltaT
} from './data';

import {
  setFallBackToMinDate,
  fallbackToMinDate,
  wsReconnection,
  webSocket
} from './websocket';



// ─────────────────────────────────────────────
// Control Variables
// ─────────────────────────────────────────────

export let observerId = -91000; // Hera
export let simulationBaseTime = new Date();
export let simulationTime = new Date();
export let realBaseTime = new Date();
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


// ─────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────

const timeInputElement = document.getElementById('time-input');

export function setup() {
  // General
  setParamsFromURL();
  updatePlaybackButton();
  updateSpeed();
  updateStarFieldVisibilityButton();

  // Listeners 
  setInterval(updatePlaceholder, 7);
  setInterval(hideUnavailableOptions, deltaT);

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

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
        setSimulationDateTo(simulationTime, false);
    } else if (document.visibilityState === "visible") {
        wsReconnection();
    }
  });
}


// ─────────────────────────────────────────────
// Getters
// ─────────────────────────────────────────────

export function getSimulationTime() {
  const elapsedTime = new Date() - realBaseTime;
  const scaledTime = elapsedTime * speedValues[speedLevel - 1];

  simulationTime = new Date(simulationBaseTime.getTime() + scaledTime);

  if (simulationTime.getTime() > maxDate.getTime()) setSimulationDateTo(minDate, false);
  return simulationTime;
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



// ─────────────────────────────────────────────
// Setters
// ─────────────────────────────────────────────

export function setSimulationTime(dateString) {
  timeInputElement.value = "";
  timeInputElement.blur();

  if (!dateString) {
    setSimulationDateTo(new Date(minDate.getTime()), simulationRunning);
    return;
  }

  const isZulu = dateString.toUpperCase().includes("Z");
  const cleaned = dateString.replace(/Z/gi, "").trim();
  const parts = cleaned.split(/[^0-9]+/).filter(p => p !== "");

  // Defaults if missing, for year/month/day use fixed fallback, for time use 0
  const defaultParts = [1970, 1, 1, 0, 0, 0, 0];

  // Parse each part or fallback to default
  const parsedParts = defaultParts.map((defaultVal, i) => {
    let val = parts[i] !== undefined ? parseInt(parts[i]) : defaultVal;
    // For year, month, day: if val is 0 or invalid, use default 1 (except year)
    if (i === 0) {
      if (isNaN(val) || val === 0) val = defaultVal; // year fallback (1970)
    } else if (i === 1 || i === 2) {
      if (isNaN(val) || val <= 0) val = 1; // month or day fallback to 1
    } else {
      if (isNaN(val) || val < 0) val = 0; // time parts fallback to 0
    }
    return val;
  });

  const [y, m, d, h, min, s, ms] = parsedParts;

  const parsedDate = isZulu
    ? new Date(Date.UTC(y, m - 1, d, h, min, s, ms))
    : new Date(y, m - 1, d, h, min, s, ms);

  const finalDate = isNaN(parsedDate.getTime())
    ? new Date(minDate)
    : new Date(Math.max(minDate.getTime(), Math.min(parsedDate.getTime(), maxDate.getTime())));

  setSimulationDateTo(finalDate, simulationRunning);
}

export function simulationRunningStore(bool) {
  simulationRunning = bool;
}

export function setParamsFromURL() {
  if(webSocket?.readyState !== WebSocket.OPEN) return;
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
      observerId = -9101310;
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

function setRealBaseTime(date) {
  if (date instanceof Date && !isNaN(date.getTime())) realBaseTime = date;
  else realBaseTime = new Date;
}



// ─────────────────────────────────────────────
// PlayBack Controls
// ─────────────────────────────────────────────

export function updatePlaceholder() {
  timeInputElement.placeholder = getTimeString(simulationTime);
}

export function updateSimulationTime() {
  simulationTime = getSimulationTime();
}

export async function toggleSimulationRunning() {
  if(webSocket === null) return; 
  if (webSocket.readyState !== WebSocket.OPEN) return;

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
    await waitForMessages(() => instantaneousTelemetryData.requestedSize, () => lightTimeAdjustedTelemetryData.requestedSize);
    instantaneousTelemetryData.reset();
    lightTimeAdjustedTelemetryData.reset();
    requestTelemetryData();
    await waitForMessages(() => instantaneousTelemetryData.requestedSize, () => lightTimeAdjustedTelemetryData.requestedSize);
    updateObjectStates();
    updatePlaceholder();
    if(fallbackToMinDate) setFallBackToMinDate(false);
}

export async function waitForMessages(getA, getB) {
  while (getA() !== 0 || getB() !== 0) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

export function updatePlaybackButton() {
  document.getElementById('playback-button').textContent = simulationRunning ? "Pause" : "Play";
}

function updateSpeed() {
  document.getElementById('playback-speed-input').value = String(speedLevel);
}

function setSpeed() {
  const psi = document.getElementById('playback-speed-input');
  if (!psi) return;

  const speed = Math.min(maxLevel, Math.max(minLevel, Number(psi.value)));
  psi.value = String(speed);

  simulationBaseTime = new Date(getSimulationTime().getTime());
  setRealBaseTime();
  speedLevel = speed;
}

async function crementSpeed(increment) {
  const psi = document.getElementById('playback-speed-input');
  if (!psi) return;
  psi.value = Math.min(maxLevel, Math.max(minLevel, Number(psi.value) + (increment ? 1 : -1)));

  if(!increment) {
    const simulationState = simulationRunning;
    simulationRunning = false;
    await waitForMessages(() => instantaneousTelemetryData.requestedSize, () => lightTimeAdjustedTelemetryData.requestedSize);
    instantaneousTelemetryData.reset();
    lightTimeAdjustedTelemetryData.reset();
    simulationRunning = simulationState;
  }

  simulationBaseTime = new Date(simulationTime.getTime());
  realBaseTime = new Date();
  speedLevel = Number(psi.value);
}

export function changeObserver(eventTargetValue) {
  observerId = Number(eventTargetValue);
  
  const dropdown = document.getElementById('observer-dropdown');
  if (dropdown.value !== String(observerId)) {
    dropdown.value = observerId;
  }

  if(firstPersonView) toggleFirstPersonView();
  
  if(observerId === -91400 || observerId === -91120 || observerId === -91110 || observerId === -9101310 || observerId === -9102310) {
    changeCamera(observerId);
    document.getElementById('camera-box').style.display = 'block';
  }
  else {
    changeCamera(0); // Default camera
    gsapCamera();
    document.getElementById('camera-box').style.display = 'none';
  }
}



// ─────────────────────────────────────────────
// Menu Control
// ─────────────────────────────────────────────

function toggleMenu() {
  document.querySelectorAll('.controls *').forEach(el => el.classList.toggle('hidden'));
  if(infoDisplay) document.getElementById('info-box').classList.toggle('hidden');
}

function toggleFullscreen() {
  const isFullscreen = !!document.fullscreenElement;

  if (isFullscreen) document.exitFullscreen();
  else document.documentElement.requestFullscreen();

  updateFullScreenButton(!isFullscreen);
}

function updateFullScreenButton(isFullscreen) {
  const btn = document.getElementById('full-screen-button');

  if (!btn) return; // Avoid errors if button is missing

  const color = isFullscreen ? lightColor : darkColor;
  btn.style.borderColor = color;
  btn.style.color = color;
}

function toggleLightTimeAdjustment() {
  lightTimeAdjustment = !lightTimeAdjustment; // Toggle the boolean value
  updateLighTimeAdjustmentButton();
}

function updateLighTimeAdjustmentButton() {
  const btn = document.getElementById('light-time-adjustment-button');
  if (!btn) return;
  const color = lightTimeAdjustment ? lightColor : darkColor;
  btn.style.borderColor = color;
  btn.style.color = color;
}

function toggleFirstPersonView() {
  if(observerId === -91400 || observerId === -91110 || observerId === -91120 || observerId === -9101310 || observerId === -9102310) return;
  firstPersonView = !firstPersonView;
  updateFirstPersonViewButton();
  gsapCameraFPV();
}

function updateFirstPersonViewButton() {
  const btn = document.getElementById('first-person-view-button');
  if (!btn) return;
  const color = firstPersonView ? lightColor : darkColor;
  btn.style.borderColor = color;
  btn.style.color = color;
}

function toggleLabelVisibility() {
  labelDisplay = !labelDisplay;
  toggleLabels();
  updateLabelVisibilityButton();
}

function updateLabelVisibilityButton() {
  const btn = document.getElementById('label-visibility-button');
  if (!btn) return;
  const color = labelDisplay ? lightColor : darkColor;
  btn.style.borderColor = color;
  btn.style.color = color;
}

function toggleTelemetryVisibility() {
  telemetryDisplay = !telemetryDisplay;
  updateTelemetryVisibilityButton();
  const tlmDiv = document.getElementById("telemetry");
  if(telemetryDisplay) tlmDiv.classList.remove("hidden");
  else tlmDiv.classList.add("hidden");
  updateTable();
}

function updateTelemetryVisibilityButton() {
  const btn = document.getElementById('data-visibility-button');
  if (!btn) return;
  const color = telemetryDisplay ? lightColor : darkColor;
  btn.style.borderColor = color;
  btn.style.color = color;
}

function toggleStarFieldVisibility() {
  starFieldDisplay = !starFieldDisplay;
  updateStarFieldVisibilityButton();
  starFieldDisplay ? show(0) : hide(0);
}

export function updateStarFieldVisibilityButton() {
  const btn = document.getElementById('starfield-visibility-button');
  if (!btn) return;
  const color = starFieldDisplay ? lightColor : darkColor;
  btn.style.borderColor = color;
  btn.style.color = color;
}

function toggleInfoDisplay() {
  infoDisplay = !infoDisplay;
  updateInfoButton();
  updateInfoDisplay();
}

function updateInfoButton() {
  const btn = document.getElementById('info-button');
  if (!btn) return;
  const color = infoDisplay ? lightColor : darkColor;
  btn.style.borderColor = color;
  btn.style.color = color;
}

function updateInfoDisplay() {
  if(infoDisplay) document.getElementById('info-box').classList.remove('hidden');
  else document.getElementById('info-box').classList.add('hidden');
}

export function getObjectId(id) {
  const tmpId = id || observerId;
  switch (tmpId) {
    case -91400:
    case -91120:
    case -91110: return -91000;
    case -9101310: return -9101000;
    case -9102310: return -9102000;
    default: return tmpId;
  }
}

const data = {
  instantaneousTelemetryData,
  lightTimeAdjustedTelemetryData
};

export function hideUnavailableOptions() {
  if(webSocket?.readyState === WebSocket.OPEN) {
    document.querySelectorAll('option').forEach(opt => {
      const id = getObjectId(+opt.value);

      const g = (a, i) => data[a].array[i]?.objects.has(id);

      let show = false;
      if(simulationRunning) show = g('instantaneousTelemetryData', 0) && g('instantaneousTelemetryData', 1);
      else show = g('instantaneousTelemetryData', 0);

      opt.classList.toggle('hidden', !show);
    });
  }
}

function toggleFrameVisibility() {
  framesVisible = !framesVisible;
  frames.forEach((frame) => {
    frame.visible = !frame.visible;
  });
  updateFrameVisibilityButton();
}

function updateFrameVisibilityButton() {
  const btn = document.getElementById('frame-visibility-button');
  const color = framesVisible ? lightColor : darkColor;
  btn.style.borderColor = color;
  btn.style.color = color;
}

function toggleAmbientLight() {
  ambientLight.visible = !ambientLight.visible;
  updateAmbientLightButton();
}

function updateAmbientLightButton() {
  const btn = document.getElementById('ambient-light-button');
  const color = ambientLight.visible ? lightColor : darkColor;
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

  let tableContent = '';

  const tmpData = lightTimeAdjustment ? lightTimeAdjustedTelemetryData : instantaneousTelemetryData;
  if (!tmpData?.array?.[0]?.objects || tmpData.array[0].objects.size === 0) return;

  const date = tmpData.array[0].date;
  document.getElementById("date").textContent = date.toISOString();


  // Add the observer at first with bold characters
  const currentOrigo = getObjectId(observerId);
    tableContent += `
    <tr>
      <td>${currentOrigo}</td> 
      <td>${objects.get(currentOrigo).name}</td>
      <td>${vec3ToStr(tmpData.array[0].objects.get(currentOrigo).position)}</td>
      <td>${vec3ToStr(tmpData.array[0].objects.get(currentOrigo).velocity)}</td>
      <td>${quatToStr(tmpData.array[0].objects.get(currentOrigo).quaternion)}</td>
      <td>${vec3ToStr(tmpData.array[0].objects.get(currentOrigo).angularVelocity)}</td>
    </tr>
  `;

  tmpData.array[0].objects.forEach((obj, id) => {
    if(id === currentOrigo) return;

    const name = objects.get(id)?.name || 'Unknown';
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
