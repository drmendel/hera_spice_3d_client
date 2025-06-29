# 3D Model and Texture Credits

This project uses a combination of custom-made and third-party assets optimized for real-time web rendering.

## 🌍 Textures (public/images/)

**Source:** [SolarSystemScope](https://www.solarsystemscope.com/textures/)  
**License:** Attribution 4.0 International (May use, adapt and share for any purpose, even comercially)  
**Files used:**
- 2k_earth_daymap.jpg
- 2k_mars.jpg
- 2k_mercury.jpg
- 2k_moon.jpg
- 2k_venus.jpg
- 8k_stars.jpg
- 8k_sun.jpg *(modified — recolored to white for realism)*

## 🛰️ Spacecraft Models (public/models/)

### Hera, Milani, Juventas  
**Author:** Mendel Dobondi-Reisz  
**Source:** Custom-built based on [ESA Hera SPICE Cosmographia models](https://spiftp.esac.esa.int/data/SPICE/HERA/misc/cosmo/models/obj/)  
**Modifications:** The original Cosmographia models were too large (~250 MB), so these were manually rebuilt from scratch and optimized (~10 MB) for efficient web use.

---

## ☄️ Celestial Bodies (public/models/)

### Didymos, Dimorphos  
**Source:** Shape models derived from [ESA Hera SPICE DSK files](https://spiftp.esac.esa.int/data/SPICE/HERA/kernels/dsk/)  
**Modifications:** Added generic textures for visual clarity. These are artistic enhancements and **do not** accurately represent the surface features of the real bodies. 

---

### Phobos
**Source:** [NASA/JPL-Caltech](https://science.nasa.gov/resource/phobos-mars-moon-3d-model/)  
**License:** Public Domain (no restrictions; no attribution required, though credit is appreciated)

---

### Deimos
**Source:** [NASA/JPL-Caltech](https://science.nasa.gov/resource/deimos-mars-moon-3d-model/)  
**License:** Public Domain (no restrictions; no attribution required, though credit is appreciated)

## 🏞️ Logo and Loading Image
- `hera_logo.png`: © European Space Agency (ESA).
- `hera_spacecraft.png`: © European Space Agency (ESA), used under CC BY-SA 3.0 IGO. Note: It got optimized for web use.

## 📌 Notes
- All models were optimized for real-time rendering in the browser using WebGPU.
- If you're using this project for anything beyond personal or educational use, make sure to verify license terms for each third-party asset.
