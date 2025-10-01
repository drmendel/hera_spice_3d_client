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

// ─────────────────────────────────────────────
// Configurational values
// ─────────────────────────────────────────────

const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
const host = window.location.host;                           // e.g., mywebsite.com

const local = false;
export let webSocketUrl = local ? "ws://localhost:8080/ws/" : `${protocol}://${host}/ws/`;
export const requestPerSec = 10;                             // req/sec
export const canvasName = 'threeCanvas';                     // three.js canvas
export const lightColor = 'rgb(175,175,175)';              // light color for active buttons
export const darkColor = 'rgb(128,128,128)';               // dark for not active buttons
export const minDate = new Date("2024-10-07T23:58:51.818Z"); // Minimum allowed date
export const maxDate = new Date("2027-02-01T00:00:00.000Z"); // Maximum allowed date
