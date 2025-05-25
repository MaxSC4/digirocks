# 🪨 RockViewer

**Interactive rock and thin section visualization in 2D and 3D, directly in the browser.**

---

## 📚 Overview

**RockViewer** is an educational web application developed at the [GEOPS laboratory](https://www.geops.universite-paris-saclay.fr/) (Géosciences Paris-Saclay) for the Earth Sciences curriculum of **Université Paris-Saclay**.  
Its goal is to provide geology students with a lightweight, interactive tool to:

- Explore rock samples and thin sections virtually
- Measure, annotate, and analyze features
- Practice petrography and 3D spatial reasoning skills
- Generate visuals for lab reports or presentations

The app runs entirely in the browser and requires no installation.

> 🚀 Designed to support learning and teaching Earth Sciences in digital environments.

---

## ✨ Features

### 🔍 2D Viewer for Thin Sections
- Load JPEG/PNG images of thin-sections
- Pan, zoom, and switch between dark/light modes
- **Magnifying glass (loupe)** for high-resolution inspection
- Add **labels and markers** directly on the image
- Export annotated views as images (via `html2canvas`)

📷 _Example screenshot:_  
![Screenshot 2D Viewer](./screenshots/2d_viewer_example.png)

---

### 🧱 3D Model Viewer
- Load 3D rock models in `.obj`/`.mtl` format
- Use **[OrbitControls](https://threejs.org/docs/#examples/en/controls/OrbitControls)** to rotate and zoom
- Accurate **1:1** scale
- Visualize axes, scale bars, bounding boxes

📷 _Example screenshot:_  
![Screenshot 3D Viewer](./screenshots/3d_viewer_example.png)

---

### 🧰 Interaction & Tools
- 📏 **Distance and area measurement** tools (2D and 3D)
- 🏷️ **Annotation system** with editable labels
- 🌓 Theme toggle: Dark/Light mode
- 📸 Export high-resolution screenshots (with overlays)

---

## 🛠️ Tech Stack

- [![JavaScript][JavaScript-badge]][JavaScript-url] - A high-level, dynamic programming language

[JavaScript-badge]: https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript
[JavaScript-url]: }
- [![CSS][CSS-badge]][CSS-url] - A stylesheet language used to define the style of a web page

[CSS-badge]: https://img.shields.io/badge/CSS-264DE4?style=for-the-badge&logo=css
[CSS-url]: }
- [![HTML][HTML-badge]][HTML-url] - A markup language used for structure and presentation

[HTML-badge]: https://img.shields.io/badge/HTML-E34F26?style=for-the-badge&logo=html
[HTML-url]: }
- [Three.js](https://threejs.org/) – 3D rendering
- [Vite](https://vitejs.dev/) – fast development build tool
- [Vitest](https://vitest.dev/) – unit testing
- [html2canvas](https://html2canvas.hertzen.com/) – screenshot capture

---

## 🧠 Implementation Highlights

- **Custom orbit and orthographic camera controls**
- Dynamic scale bars and coordinate axes with real-time updates
- Magnifier component built with canvas overlays and clipping paths
- Measurement tools using DOM and 3D space projections
- Annotation system supporting drag, edit, and delete

---

## 📁 Project Structure

```bash
.
├── public/               # Static assets (models, images, icons)
├── scripts/              # Core logic: tools, controls, utilities
├── src/
│   ├── components/       # UI components (viewers, panels, toolbars)
│   ├── styles/           # Custom styles
│   ├── main.js           # Entry point
│   └── config.js         # Default parameters
├── tests/                # Unit & UI tests
├── index.html            # HTML entry point
├── vite.config.js        # Build tool configuration
└── vitest.config.js      # Testing setup
```

---

## 🖼️ Institutional Credits

Developed with the support of:

<table>
  <tr>
    <td align="center">
      <img src="https://www.regef.fr/wp-content/uploads/2023/01/LOGO-GEOPS-2020-1024x488-1.jpg" alt="GEOPS Logo" height="60"/>
    </td>
    <td align="center">
      <img src="https://logowik.com/content/uploads/images/paris-saclay-university1609.jpg" alt="Université Paris-Saclay Logo" height="60"/>
    </td>
  </tr>
</table>

---

## 👤 Author & Maintainer

**Maxime SC.**  
🌍 Earth Sciences student at Université Paris-Saclay  
🔗 [LinkedIn](https://www.linkedin.com/in/maxime-sc/)  
📧 maxime.soares-correia@université-paris-saclay.fr

---

## ✅ TODO

- [ ] Add multilingual support (EN/FR)
- [ ] Expand to mobile/tablet touch controls
- [ ] Add file format support for `.ply` and `.stl`
- [ ] Improve annotation export formats (e.g., GeoJSON)

