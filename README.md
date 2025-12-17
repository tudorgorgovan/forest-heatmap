## 👥 Team LoveLinux++

**ZebraHack 3.0 Finalists - 3rd Place 🏆**

- **Aylin Zulchefil** - Frontend & Design
- **Tudor Gorgovan** - Data Analysis & Algorithms
- **Raducanu Denis** - Map Logic & API Integration
- **Turtoiu Eduard** - UI/UX & Performance Optimization

---

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![ZebraHack 3.0](https://img.shields.io/badge/ZebraHack-3.0-blue.svg)](https://zebrahack.ro/)
[![Live Demo](https://img.shields.io/badge/demo-live-success.svg)](https://tudorgorgovan.github.io/forest-heatmap/)

# 🌲 Timber Transport Heatmap

Developed for the ZebraHack 3.0 Hackathon at UPB, this interactive web application bridges the gap between raw governmental data and environmental oversight. By processing live feeds from Romania's SUMAL 2.0 system, the platform identifies and visualizes timber transport 'hotspots' across the country. It serves as a strategic monitoring tool designed to enhance transparency, optimize forestry inspections, and provide a clear, data-driven overview of wood mobilization in real-time.

![Timber Transport Heatmap Preview](assets/screenshot_hackathon.png)

## ✨ Features

### 🗺️ Interactive Heatmap
- Real-time visualization of timber transport density
- Dynamic filtering by intensity levels (low, medium, high)
- Regional selection across 9 historical regions of Romania
- City search with automatic map navigation
- Detailed popup information for each hotspot

### 📊 Advanced Analytics
- Performance scoring engine with volume/trips ratio calculation and LocalStorage persistence for cross-page data export

### 🎨 Modern UI/UX
- Slate/Emerald dark theme with glassmorphism effects, CSS animations, and responsive Material Design

## 🔧 Technical Implementation

### MapLibre GL JS Integration
- **Heatmap Layer**: Custom color interpolation with density-based gradients
- **Circle Layers**: Dynamic visibility toggling for intensity filtering (low/medium/high)
- **Popup System**: Custom-styled tooltips with company details and transport volumes
- **Map Controls**: Region-based navigation with `flyTo` animations and smooth transitions
- **Expression-based Styling**: MapLibre expressions for zoom-dependent rendering

### Data Processing Pipeline
```javascript
API (SUMAL 2.0) → fetch() → JSON parsing → GeoJSON transformation → MapLibre layers
```
- **Data Source**: ZebraHack 3.0 API with real-time timber transport records
- **Format**: GeoJSON with Point geometries for hotspot coordinates
- **Aggregation**: Company-level grouping with volume and trip count calculations
- **Caching**: LocalStorage for offline persistence and performance optimization

### Performance Optimizations
- **Debounced Search**: 300ms delay on city search input to reduce API calls
- **Lazy Loading**: Markers loaded on-demand based on visible map bounds
- **Efficient Updates**: GeoJSON updates only for changed features, not full re-render
- **GPU Acceleration**: CSS `will-change` property for smooth animations
- **Event Delegation**: Single event listener for multiple markers

### Architecture
- **Modular JavaScript**: ES6 modules with separate concerns (map logic, analytics, API client)
- **CSS Variables**: Centralized theming with custom properties for colors and spacing
- **Event-driven**: Asynchronous data fetching with `async/await` and Promise-based error handling
- **Responsive**: Mobile-first design with CSS Grid and Flexbox layouts

## 🚀 Quick Start

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- A local web server (required for ES6 modules and CORS)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/tudorgorgovan/forest-heatmap.git
cd forest-heatmap
```

2. Start a local server:

**Option 1: Python**
```bash
python -m http.server 8000
```

**Option 2: Node.js**
```bash
npx serve
```

**Option 3: VSCode Live Server**
- Install the "Live Server" extension
- Right-click on `index.html` > "Open with Live Server"

3. Open your browser and navigate to:
```
http://localhost:8000
```

## 📖 Usage

1. **Start at index.html** to understand the concept of heatmaps and hotspots
2. **Navigate to map.html** to explore the interactive map
3. **Use filters** to select regions and intensity levels
4. **Click on cells** to see company details and volumes
5. **Press "Analyze Performance"** for advanced performance calculations

## 🌐 Live Demo

The project is deployed on GitHub Pages and can be accessed at:

**[https://tudorgorgovan.github.io/forest-heatmap/](https://tudorgorgovan.github.io/forest-heatmap/)**

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3 (modular), JavaScript (vanilla ES6+)
- **Mapping**: MapLibre GL JS 3.3.1
- **Design**: Slate/Emerald palette with CSS animations
- **API**: ZebraHack 3.0 API integration with real data from SUMAL 2.0 (Ministry of Environment)
- **Storage**: LocalStorage for data persistence
- **Icons**: Font Awesome 6.4.0
- **Fonts**: Google Fonts (Inter)

## 🔧 Configuration

### Customize Regions

Edit `scripts/map.js` and update the `REGION_BOUNDS` object:

```javascript
const REGION_BOUNDS = {
    'transilvania': { center: [24.5, 46.5], zoom: 8 },
    'muntenia': { center: [25.5, 44.8], zoom: 8 },
    // add more regions...
};
```

### Adjust Heatmap Colors

Modify the color gradient in `scripts/map.js`:

```javascript
'heatmap-color': [
    'interpolate',
    ['linear'],
    ['heatmap-density'],
    0, 'rgba(33,102,172,0)',
    0.2, 'rgb(103,169,207)',
    0.4, 'rgb(209,229,240)',
    0.6, 'rgb(253,219,199)',
    0.8, 'rgb(239,138,98)',
    1, 'rgb(178,24,43)'
]
```

## 🏆 Acknowledgments

- **ZebraHack 3.0** - Hackathon Web Technologies, Faculty of Automatic Control and Computers, University POLITEHNICA of Bucharest
- **SUMAL 2.0** - Ministry of Environment timber tracking system
- **Inspectorul Padurii** - Public portal for forest monitoring

## 📝 Technical Notes

- All paths are relative for GitHub Pages compatibility
- Data is fetched live from ZebraHack 3.0 API
- Design optimized for Chrome, Firefox, Safari, Edge (recent versions)
- JavaScript must be enabled
- Recommended minimum resolution: 1280x720

## 🐛 Issues & Contributions

If you encounter any issues or have suggestions for improvements, please open an issue on GitHub.

---

**Made with 💚 for the environment and technology by Team LoveLinux++**
