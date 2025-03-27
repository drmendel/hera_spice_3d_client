/*
 *  _______  _____  _____ _______ _______      ______  _______ _______ _______
 *  |______ |_____]   |   |       |______      |     \ |_____|    |    |_____|
 *  ______| |       __|__ |_____  |______      |_____/ |     |    |    |     |
 *
*/

/**
 * Mapping of Spice Objects to their respective identifiers.
 * These represent celestial bodies and spacecraft in the CSPICE system.
 */
const objects = new Map([
    [10, "SUN"],                        // The Sun
    [199, "MERCURY"],                   // Mercury
    [299, "VENUS"],                     // Venus
    [399, "EARTH"],                     // Earth
    [301, "MOON"],                      // Moon (of Earth)
    [499, "MARS"],                      // Mars
    [401, "PHOBOS"],                    // Phobos (moon of Mars)
    [402, "DEIMOS"],                    // Deimos (moon of Mars)
    [-658030, "DIDYMOS"],               // Didymos (asteroid system)
    [-658031, "DIMORPHOS"],             // Dimorphos (moon of Didymos, target of DART mission)
    [-91900, "DART IMPACT SITE"],       // DART Impact Site on Dimorphos
    [-91000, "HERA SPACECRAFT"],        // HERA spacecraft (ESA mission)
    [-15513000, "JUVENTAS SPACECRAFT"]  // JUVENTAS cubesat
]);

/**
 * Mapping of HERA spacecraft camera identifiers to their names.
 * These represent different camera systems on the HERA spacecraft.
 */
const heraCameras = new Map([
    [-91500, "HERA SMC"],      // HERA's Small Monitoring Camera
    [-91400, "HERA HSH"],      // HERA's HyperScout Hyperspectral
    [-91200, "HERA TIRI"],     // HERA's Thermal InfraRed Imager
    [-91120, "HERA AFC-2"],    // HERA's Advanced Focused Camera 2
    [-91110, "HERA AFC-1"]     // HERA's Advanced Focused Camera 1
]);

const juventasCameras = new Map([
    [-91, "JUVI"]
]);