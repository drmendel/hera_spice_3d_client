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
export const objects = new Map([
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
    [-15513000, "JUVENTAS SPACECRAFT"], // JUVENTAS cubesat
    [-9102000, "MILANI SPACECRAFT"]     // MILANI cubesat    
]);

/**
 * Mapping of HERA spacecraft camera identifiers to their names.
 * These represent different camera systems on the HERA spacecraft.
 */
export const heraCameras = new Map([
    [-91500, "HERA SMC"],      // HERA's Small Monitoring Camera
    [-91400, "HERA HSH"],      // HERA's HyperScout Hyperspectral
    [-91200, "HERA TIRI"],     // HERA's Thermal InfraRed Imager
    [-91120, "HERA AFC-2"],    // HERA's Asteriod Framing Camera
    [-91110, "HERA AFC-1"]     // HERA's Asteroid Framing Camera 1
]);
/* 
    HERA_SPACECRAFT (-91000)*    HERA_LGA+X (-91071)*
    HERA_SA+Y (-91011)*          HERA_LGA-X (-91072)*
    HERA_SA-Y (-91015)*          HERA_AFC-1 (-91110)*
    HERA_STR-OH1 (-91061)*       HERA_AFC-2 (-91120)*
    HERA_STR-OH2 (-91062)*       HERA_TIRI (-91200)*
    HERA_JUVENTAS_IFP (-91063)*  HERA_PALT (-91300)*
    HERA_MILANI_IFP (-91064)*    HERA_HSH (-91400)*
    HERA_HGA (-91070)*           HERA_SMC (-91500)*
*/

export const juventasCameras = new Map([
    [-15513310, "JUVENTAS NAVCAM"],
    [-15513610, "JUVENTAS CCAM"]
]);
/*
    JUVENTAS_SPACECRAFT (-15513000)*  JUVENTAS_JURA-Y (-15513114)*
    JUVENTAS_SA+Y (-15513011)*        JUVENTAS_GRASS+X (-15513210)*
    JUVENTAS_SA-Y (-15513015)*        JUVENTAS_GRASS+Z (-15513220)*
    JUVENTAS_ISL+X (-15513071)*       JUVENTAS_NAVCAM (-15513310)*
    JUVENTAS_ISL-X (-15513072)*       JUVENTAS_LIDAR (-15513410)*
    JUVENTAS_JURA+X (-15513111)*      JUVENTAS_STR-1 (-15513510)*
    JUVENTAS_JURA-X (-15513112)*      JUVENTAS_STR-2 (-15513520)*
    JUVENTAS_JURA+Y (-15513113)*      JUVENTAS_CCAM (-15513610)*
*/

export const milaniCameras = new Map([
    [-91002310, "MILANI NAVCAM"],
]);
/*
    MILANI_SPACECRAFT (-9102000)*   MILANI_NAVCAM (-9102310)*
    MILANI_SA+Y (-9102011)*         MILANI_LIDAR (-9102410)*
    MILANI_SA-Y (-9102015)*         MILANI_MLRH_1 (-9102511)*
    MILANI_ASPECT_VIS (-9102110)*   MILANI_MLRH_2 (-9102512)*
    MILANI_ASPECT_NIR1 (-9102120)*  MILANI_STR (-9102610)*
    MILANI_ASPECT_NIR2 (-9102130)*  MILANI_ILS+X (-9102711)*
    MILANI_ASPECT_SWIR (-9102140)*  MILANI_ILS-X (-9102712)*
    MILANI_VISTA (-9102210)*
*/
