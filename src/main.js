import * as ctrl from './controls';
import * as THREE from 'three';

// Get the canvas element
const canvas = document.getElementById('threeCanvas');

// Set up Three.js scene
const scene = new THREE.Scene();

// Set up camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Set up renderer
export const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create a basic cube
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Set camera position
camera.position.z = 5;

//timeRun = true;

// Render the scene
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  if(!ctrl.simulationRunning) return;
  cube.rotation.x += 0.01 * ctrl.speedValues[ctrl.speedLevel - 1];
  cube.rotation.y += 0.01 * ctrl.speedValues[ctrl.speedLevel - 1];
}

animate();

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});