# Hera Spice 3D Client

## Overview
Hera Spice 3D Client is a Three.js-based web application that visualizes the motion of the Hera spacecraft and other celestial objects using SPICE data. The simulation renders real-time interpolated motion of multiple objects, with a focus on accuracy and performance.

## Features
- **WebGPU-powered rendering** for high-performance visualization
- **Real-time motion interpolation** between SPICE time steps
- **Dynamic object rendering**, including 1000+ moving bodies and high-detail shapes
- **WebSocket integration** for live data streaming from a C++ uWebSockets server
- **Dockerized deployment** with Nginx for serving static assets

## Project Structure
```
hera_spice_3d_client/
├── public/         # Static assets
├── src/            # Source code
│   ├── components/ # Three.js scene components
│   ├── utils/      # Helper functions for SPICE data handling
│   ├── main.js     # Entry point
│   ├── websocket.js # WebSocket client
├── index.html      # Main HTML file
├── package.json    # Dependencies and scripts
├── package-lock.json
├── vite.config.js  # Vite configuration
├── Dockerfile      # Docker build file
├── nginx.conf      # Nginx configuration
└── README.md       # This file
```

## Installation
### Prerequisites
- Node.js & npm
- Docker (optional, for deployment)

### Steps
```sh
git clone https://github.com/yourusername/hera_spice_3d_client.git
cd hera_spice_3d_client
npm install
```

## Running the Project
### Development Mode
```sh
npm run dev
```
This starts a Vite development server with hot reloading.

### Production Build
```sh
npm run build
```
This generates a static build in the `dist/` folder.

### Deploying with Docker
```sh
docker build -t hera_spice_3d_client .
docker run -p 8080:80 hera_spice_3d_client
```
This serves the project using Nginx on port 8080.

## WebSocket Connection
The Three.js client connects to the C++ uWebSockets server for real-time data updates. Update the WebSocket URL in `websocket.js` if necessary:
```js
const ws = new WebSocket('ws://yourserver.com:port');
```

## License
MIT License

## Contributing
Feel free to submit issues and pull requests to improve the project.

