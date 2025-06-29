# Hera Spice 3D Client

`hera_spice_3d_client` is a Three.js-based web application that visualizes the motion of the Hera spacecraft and relevant solar system bodies involved in the Hera mission. It simulates real-time, interpolated trajectories with a strong emphasis on both accuracy and performance using GPU accelerated rendering.

The application relies on the [hera_spice_ws_server](https://github.com/drmendel/hera_spice_ws_server), a custom WebSocket-based backend service written in C/C++ that provides real-time telemetry and ephemeris data derived directly from ESA’s SPICE kernel files.

## 🚀 Features

### Technical Features
- **WebGPU-powered rendering** for high-performance, modern 3D visualization
- **Real-time motion interpolation** between SPICE time steps for smooth trajectories
- **Dockerized deployment** with Nginx for efficient static file serving and easy setup

### User Features
- **Time control**: Set the simulation time to any desired epoch
- **Simulation speed adjustment**: Choose from 12 different speed levels
- **Observer selection**: Switch viewpoint between spacecraft, celestial bodies, and onboard cameras
- **First-person view** mode for immersive perspective from the objects
- **Fullscreen mode** to utilize the full resolution of the display for maximum visual clarity
- **Ambient light**: Illuminate dark regions of the scene
- **Starfield display**: Show or hide background stars
- **Label display**: Enable or disable object name overlays
- **SPICE frame visualization**: Toggle display of body-fixed frames used by SPICE
- **Light-time correction toggle**: Optionally simulate light-travel delay in object positioning
- **Telemetry display**: Real-time numerical readout with scientific notation (4-digit precision)
- **Info panel**: UI help, model descriptions, and project background

## ⚙️ Installation

A pre-built Docker image is available on Docker Hub:

```bash
docker pull drmendel/hera_spice_3d_client:latest
```

Alternatively, to build the project from source:

```bash
git clone https://github.com/drmendel/hera_spice_3d_client.git
cd hera_spice_3d_client
npm install
npm run build
```

The built static files can be served by any standard web server: Nginx, Apache, Caddy, etc.

## 📡 Binary Protocol Specification

### Request Format (16 bytes total)

| Field        | Type     | Size (bytes) | Description                            |
|--------------|----------|--------------|----------------------------------------|
| Timestamp    | double   | 8            | Unix time in seconds (UTC)            |
| Mode         | char     | 1            | Query mode: 'i' or 'l'                |
| Observer ID  | int32_t  | 4            | Integer ID of the observer            |

**Request size:** 13 bytes

### Request Modes

- `'i'`: Instantaneous (uncorrected) state  
- `'l'`: Light-time and stellar aberration corrected (LT+S)  

### Response Format (variable size)

| Field           | Type     | Size (bytes)     | Description                            |
|-----------------|----------|------------------|--------------------------------------|
| Timestamp       | double   | 8                | Echoed Unix timestamp (seconds UTC) |
| Mode/Error Flag | char     | 1                | 'i', 'l', 'e', 'g', or 'h'  |
| Data Payload    | variable | 0 to 1620        | 0-15 ObjectData

**Minimum size:** 9 bytes (timestamp + error)  
**Maximum size:** 1629 bytes (timestamp + mode + 15 objects × 13 bytes each)

### Response Modes/Errors

- `'i'`: Instantaneous result
- `'l'`: LT+S corrected result
- `'e'`: General error (e.g., bad input)
- `'g'`: Invalid observer in 'i' mode  
- `'h'`: Invalid observer in 'l' mode  

#### ObjectData Structure (per object)

| Field           | Type      | Size (bytes)     | Description                   |
|-----------------|-----------|------------------|-------------------------------|
| objectId        | int32_t   | 4                | SPICE object identifier        |
| position        | double[3] | 24 (3 × 8 bytes) | Position vector (X, Y, Z)      |
| velocity        | double[3] | 24 (3 × 8 bytes) | Velocity vector (X, Y, Z)      |
| quaternion      | double[4] | 32 (4 × 8 bytes) | Orientation quaternion (w, x, y, z) |
| angularVelocity | double[3] | 24 (3 × 8 bytes) | Angular velocity vector         |

**Total size per object:** 108 bytes

## 🛰️ Notes

- This application relies on the backend server (`hera_spice_ws_server`)  
- The simulation interpolates between discrete SPICE time steps, so very high simulation speeds may produce inaccurate or unrealistic motion paths
- Camera views are fixed when observing from onboard instruments to accurately reflect their real orientations; other observer modes allow free camera control
- Performance depends on the client device’s GPU power and WebGPU support: for older hardware, fallback or degraded performance may occur
- The application is designed primarily for scientific visualization and validation of SPICE data, not for operational spacecraft control or navigation

## 📎 Credits

This project includes third-party images and 3D models.  
For full attribution and licensing details, see [CREDITS.md](CREDITS.md).

## 📦 Dependencies and License

This project depends on the following third-party libraries.

| Dependency   | License                                                                  | Copyright / Notes                                                             |
|--------------|---------------------------------------------------------------------------|--------------------------------------------------------------------------------|
| **Three.js** | [MIT License](https://github.com/mrdoob/three.js/blob/dev/LICENSE)       | © 2010–2025 three.js authors. Free for all use with attribution.              |
| **GSAP**     | [Standard No Charge GSAP License](https://greensock.com/standard-license/) | © GreenSock, Inc. Free for most uses. Commercial use may require a license.   |

License files for all dependencies are included in the `licenses/` folder of this project.