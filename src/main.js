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
    simulationRunningStore,
    setSimulationTime,
    updatePlaceholder,
    setup
} from './controls';

import {
    loadThreeJSEngine,
    gsapCamera,
    animate
} from './engine';

import { openWebSocket } from './websocket';



// ─────────────────────────────────────────────
// Main - Entry Point
// ─────────────────────────────────────────────

async function main() {
    try {
        await openWebSocket();
    } catch {
        simulationRunningStore(false);
        setSimulationTime("2025-03-12T09:27:00.000");
        updatePlaceholder();
    }

    await loadThreeJSEngine();
    setup();
    gsapCamera();
    animate();
}

main();