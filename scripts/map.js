(function () {
  const isMapPage = document.body?.dataset?.page === "map";
  if (!isMapPage) {
    return;
  }

  const API_BASE = "https://zebrahack.iqnox.tech/api";
  const APP_KEY = document.body.dataset.appKey || "LoveLinux++";
  const statusEl = document.getElementById("map-status");
  const operatorsList = document.getElementById("operators-list");
  const companiesListEl = document.getElementById("companies-list");
  const companiesStateEl = document.getElementById("companies-state");
  const companiesCountEl = document.getElementById("companies-count");
  const regionButtons = document.querySelectorAll(".region-chip");
  const intensityInputs = document.querySelectorAll("input[data-intensity]");
  const defaultStatusText = "Gata de explorat";
  const DEFAULT_COUNTRY_BBOX = [20.0, 43.4, 29.9, 48.5];
  const REGION_BOUNDS = {
    all: {
      name: "Romania",
      bbox: [20.0, 43.4, 29.9, 48.5],
    },
    muntenia: {
      name: "Muntenia",
      bbox: [24.0, 43.6, 27.7, 45.8],
    },
    transilvania: {
      name: "Transilvania",
      bbox: [21.2, 45.2, 25.7, 47.6],
    },
    moldova: {
      name: "Moldova",
      bbox: [26.0, 45.6, 28.8, 48.4],
    },
    dobrogea: {
      name: "Dobrogea",
      bbox: [27.5, 43.7, 29.9, 45.8],
    },
    maramures: {
      name: "Maramures",
      bbox: [23.4, 47.5, 25.3, 48.4],
    },
    bucovina: {
      name: "Bucovina",
      bbox: [25.0, 47.0, 27.2, 48.4],
    },
    oltenia: {
      name: "Oltenia",
      bbox: [22.2, 43.5, 24.5, 45.3],
    },
    crisana: {
      name: "Crisana",
      bbox: [21.0, 46.0, 23.7, 47.7],
    },
    banat: {
      name: "Banat",
      bbox: [20.2, 44.9, 22.6, 46.5],
    },
  };
  const INTENSITY_RANGES = {
    low: { min: 0, max: 0.1 },
    medium: { min: 0.1, max: 0.25 },
    high: { min: 0.25, max: Infinity },
  };
  const intensityState = {
    low: true,
    medium: true,
    high: true,
  };
  let map;
  let hotspotPopup;
  let heatmapAbortController;
  let companiesAbortController;
  let companiesLoadingTimer;
  let heatmapRequestId = 0;
  let companiesRequestId = 0;
  let selectedRegionKey = null;
  let pendingRegionKey = null;
  let layersReady = false;

  // Pagination State
  let allCompanies = [];
  let currentPage = 1;
  const ITEMS_PER_PAGE = 20;

  const emptyGeoJSON = {
    type: "FeatureCollection",
    features: [],
  };

  function setStatus(message, state = "idle") {
    if (!statusEl) return;
    statusEl.classList.remove(
      "map-status--idle",
      "map-status--loading",
      "map-status--error",
      "map-status--success"
    );
    statusEl.classList.add(`map-status--${state}`);
    const textNode = statusEl.querySelector(".status-text");
    if (textNode) {
      textNode.textContent = message;
    }
  }

  function formatNumber(value) {
    if (value === undefined || value === null) return "-";
    return Intl.NumberFormat("ro-RO", {
      maximumFractionDigits: 1,
    }).format(value);
  }

  function updateOperatorsList(collection) {
    if (!operatorsList) return;
    const totals = new Map();

    (collection.features || []).forEach((feature) => {
      const operators = feature.properties?.operators;
      if (Array.isArray(operators)) {
        operators.forEach((entry) => {
          if (!entry || !entry.name) return;
          const weight =
            entry.volume ||
            entry.total_volume ||
            entry.count ||
            feature.properties?.weight ||
            1;
          totals.set(entry.name, (totals.get(entry.name) || 0) + weight);
        });
      }
    });

    const topOperators = [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (!topOperators.length) {
      operatorsList.innerHTML =
        '<li class="muted">Nu avem inca operatori pentru zona curenta.</li>';
      return;
    }

    operatorsList.innerHTML = topOperators
      .map(
        ([name, volume]) =>
          `<li><span>${name}</span><span class="operator-volume">${formatNumber(
            volume
          )}</span></li>`
      )
      .join("");
  }

  function getOperatorDescriptor(operator = {}) {
    const transports = operator.transport_count ?? operator.count;
    const volume = operator.volume ?? operator.total_volume;

    if (transports !== undefined) {
      return `${formatNumber(transports)} transporturi`;
    }
    if (volume !== undefined) {
      return `${formatNumber(volume)} m3`;
    }
    return "fara detalii publice";
  }

  function buildPopupHTML(feature) {
    const props = feature?.properties || {};
    const operators = Array.isArray(props.operators) ? props.operators : [];
    const pointCount = props.point_count ?? props.count ?? props.weight ?? 0;

    const operatorsMarkup = operators
      .slice(0, 4)
      .map(
        (op) => `
                <li>
                    <div>
                        <span class="popup-operator-name">${op.name ?? "Operator necunoscut"
          }</span>
                        ${op.role
            ? `<span class="popup-operator-role">${op.role}</span>`
            : ""
          }
                    </div>
                    <span class="popup-operator-meta">${getOperatorDescriptor(
            op
          )}</span>
                </li>`
      )
      .join("");

    const fallbackMessage =
      '<li class="popup-operator-empty">Nu avem operatori raportati pentru aceasta celula.</li>';

    return `
            <div class="popup-wrapper">
                <p class="popup-eyebrow">Celula selectata</p>
                <h3 class="popup-title">${formatNumber(
      pointCount
    )} puncte GPS</h3>
                ${props.weight
        ? `<p class="popup-subtitle">Intensitate relativa: ${formatNumber(
          props.weight
        )}</p>`
        : ""
      }
                <h4 class="popup-list-title">Operatori principali</h4>
                <ul class="popup-operators">
                    ${operatorsMarkup || fallbackMessage}
                </ul>
            </div>
        `;
  }

  function setCompaniesState(message, variant = "muted") {
    if (!companiesStateEl) return;
    companiesStateEl.textContent = message;
    companiesStateEl.classList.remove("muted", "loading", "error", "success");
    companiesStateEl.classList.add(variant);
  }


  function renderCompaniesPage(page) {
    if (!companiesListEl) {
      console.error("companiesListEl missing!");
      return;
    }

    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const items = allCompanies.slice(start, end);
    console.log(`Rendering page ${page}, items: ${items.length}, total: ${allCompanies.length}`);
    const totalPages = Math.ceil(allCompanies.length / ITEMS_PER_PAGE);

    // Generate Items HTML
    const itemsMarkup = items.map(company => `
        <article class="company-card" tabindex="0">
            <div class="company-top">
                <h3 class="company-name">${company.name || "Companie necunoscuta"}</h3>
                <span class="role-badge ${company.role === "DESTINATAR" ? "destinatar" : "emitent"}">
                    ${company.role || "N/A"}
                </span>
            </div>
            <div class="company-metrics">
                <div>
                    <strong>${formatNumber(company.transport_count)}</strong>
                    <span>transporturi</span>
                </div>
                <div>
                    <strong>${formatNumber(company.total_volume)}</strong>
                    <span>m3 inregistrati</span>
                </div>
            </div>
        </article>
    `).join("");

    // Generate Pagination HTML
    let paginationMarkup = "";
    if (totalPages > 1) {
      paginationMarkup = `
            <div class="companies-pagination">
                <button class="pagination-btn" ${page === 1 ? "disabled" : ""} data-action="prev">
                    <i class="fa-solid fa-chevron-left"></i>
                </button>
                <span class="pagination-info">Pagina ${page} din ${totalPages}</span>
                <button class="pagination-btn" ${page === totalPages ? "disabled" : ""} data-action="next">
                    <i class="fa-solid fa-chevron-right"></i>
                </button>
            </div>
        `;
    }

    companiesListEl.innerHTML = itemsMarkup + paginationMarkup;

    // Attach pagination listeners
    const prevBtn = companiesListEl.querySelector('[data-action="prev"]');
    const nextBtn = companiesListEl.querySelector('[data-action="next"]');

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        if (currentPage > 1) {
          currentPage--;
          renderCompaniesPage(currentPage);
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        if (currentPage < totalPages) {
          currentPage++;
          renderCompaniesPage(currentPage);
        }
      });
    }
  }

  function renderCompanies(companies = [], timestamp) {
    // Store full list in state
    allCompanies = companies;
    currentPage = 1;
    console.log("renderCompanies called with:", companies.length, "companies");

    if (!companies.length) {
      companiesListEl.innerHTML = '<p class="companies-empty">Nu exista companii in cadru pentru aceasta incadrare.</p>';
      if (companiesCountEl) companiesCountEl.textContent = "0 companii";
      setCompaniesState(timestamp ? `Zona calma • ${timestamp}` : "Zona calma", "muted");
      return;
    }

    if (companiesCountEl) {
      companiesCountEl.textContent = `${companies.length} companii`;
    }

    setCompaniesState(timestamp ? `Actualizat • ${timestamp}` : "Actualizat", "success");

    // Render first page
    renderCompaniesPage(1);
  }

  function highlightRegionButtons() {
    regionButtons.forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.region === selectedRegionKey
      );
    });
  }



  function focusRegion(regionKey) {
    if (!REGION_BOUNDS[regionKey]) return;
    if (!map) {
      pendingRegionKey = regionKey;
      return;
    }
    const region = REGION_BOUNDS[regionKey];
    selectedRegionKey = regionKey;
    highlightRegionButtons();
    setStatus(`Exploram regiunea ${region.name}...`, "loading");
    setCompaniesState("Se incarca companiile...", "loading");

    console.log(`Focusing on ${regionKey}:`, region.bbox);

    // Use fitBounds to ensure the region fits in view.
    // The 'moveend' event will trigger data fetching once the movement finishes.
    try {
      map.fitBounds(region.bbox, {
        padding: 40,
        duration: 1200,
      });
    } catch (e) {
      console.error("FitBounds Error:", e);
    }
  }

  function applyIntensityFilter() {
    if (!layersReady || !map) return;
    const layerIds = ["heatmap-layer", "heatmap-points"];
    const activeKeys = Object.entries(intensityState).filter(
      ([, value]) => value
    );

    if (!activeKeys.length) {
      layerIds.forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, "visibility", "none");
        }
      });
      return;
    }

    const clauses = activeKeys.map(([key]) => {
      const range = INTENSITY_RANGES[key];
      const minExpr = [
        ">=",
        ["coalesce", ["get", "weight"], 0],
        range.min,
      ];
      if (range.max === Infinity) {
        return minExpr;
      }
      return [
        "all",
        minExpr,
        ["<", ["coalesce", ["get", "weight"], 0], range.max],
      ];
    });
    const filter = ["any", ...clauses];

    layerIds.forEach((layerId) => {
      if (!map.getLayer(layerId)) return;
      map.setLayoutProperty(layerId, "visibility", "visible");
      map.setFilter(layerId, filter);
    });
  }

  function getCurrentBBox() {
    if (!map) return null;
    const bounds = map.getBounds();
    if (!bounds) return null;
    return [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ].map((value) => Number(value.toFixed(5)));
  }

  async function fetchHeatmap(bboxOverride) {
    if (!map) return;
    const bbox = bboxOverride || getCurrentBBox();
    if (!bbox) return;

    const zoomLevel = Math.round(map.getZoom());
    const url = new URL(`${API_BASE}/heatmap`);
    url.searchParams.set("bbox", bbox.join(","));
    url.searchParams.set("zoom", zoomLevel);

    if (heatmapAbortController) {
      heatmapAbortController.abort();
    }
    heatmapAbortController = new AbortController();
    const requestId = ++heatmapRequestId;

    setStatus("Actualizam celulele...", "loading");

    try {
      const response = await fetch(url.toString(), {
        headers: {
          "X-App-Key": APP_KEY,
        },
        signal: heatmapAbortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Eroare API: ${response.status}`);
      }

      if (requestId !== heatmapRequestId) {
        return;
      }

      const data = await response.json();
      const source = map.getSource("heatmap-source");
      if (source) {
        source.setData(data);
      }
      updateOperatorsList(data);
      setStatus(
        `Ultima actualizare: ${new Date().toLocaleTimeString("ro-RO")}`,
        "success"
      );
    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }
      console.error("Nu putem incarca heatmap-ul:", error);
      setStatus("Nu putem incarca datele. Mai incearca.", "error");
    }
  }

  async function fetchCompanies(bboxOverride) {
    if (!companiesListEl) return;
    const bbox = bboxOverride || getCurrentBBox();
    if (!bbox) return;

    if (companiesAbortController) {
      companiesAbortController.abort();
    }
    companiesAbortController = new AbortController();
    const requestId = ++companiesRequestId;

    if (companiesLoadingTimer) {
      clearTimeout(companiesLoadingTimer);
    }
    companiesLoadingTimer = window.setTimeout(() => {
      if (requestId === companiesRequestId) {
        setCompaniesState("Se incarca companiile...", "loading");
      }
    }, 350);

    const width = bbox[2] - bbox[0];
    const height = bbox[3] - bbox[1];

    // API limit is 1.5 degrees
    if (width > 1.5 || height > 1.5) {
      if (companiesLoadingTimer) clearTimeout(companiesLoadingTimer);
      companiesListEl.innerHTML = '<p class="companies-empty">Zona selectata este prea mare. Apropie harta pentru a vedea companiile.</p>';
      if (companiesCountEl) companiesCountEl.textContent = "Harta prea mare";
      setCompaniesState("Apropie harta pentru detalii", "muted");
      return;
    }

    try {
      const url = new URL(`${API_BASE}/area/companies`);
      url.searchParams.set("bbox", bbox.join(","));

      const response = await fetch(url.toString(), {
        headers: {
          "X-App-Key": APP_KEY,
        },
        signal: companiesAbortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Eroare companii: ${response.status}`);
      }

      if (requestId !== companiesRequestId) {
        return;
      }

      const data = await response.json();
      const companies = Array.isArray(data) ? data : data?.companies || [];
      const sorted = [...companies].sort((a, b) => {
        const volumeA = a.total_volume || 0;
        const volumeB = b.total_volume || 0;
        if (volumeB !== volumeA) {
          return volumeB - volumeA;
        }
        return (b.transport_count || 0) - (a.transport_count || 0);
      });

      const timestamp = new Date().toLocaleTimeString("ro-RO", {
        hour: "2-digit",
        minute: "2-digit",
      });

      if (companiesLoadingTimer) {
        clearTimeout(companiesLoadingTimer);
        companiesLoadingTimer = null;
      }

      renderCompanies(sorted, timestamp);
    } catch (error) {
      if (companiesLoadingTimer) {
        clearTimeout(companiesLoadingTimer);
        companiesLoadingTimer = null;
      }
      if (error.name === "AbortError") {
        return;
      }
      console.error("Nu putem incarca lista companiilor:", error);
      setCompaniesState("Nu putem incarca companiile.", "error");
    }
  }

  function initMap() {
    const mapContainer = document.getElementById("map");
    if (!mapContainer || typeof maplibregl === "undefined") {
      console.error(
        "MapLibre nu este disponibil sau lipseste containerul #map."
      );
      setStatus("Harta nu poate fi initializata.", "error");
      return;
    }

    map = new maplibregl.Map({
      container: mapContainer,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [24.969, 45.943],
      zoom: 6,
      maxZoom: 13,
      minZoom: 4,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.addControl(
      new maplibregl.ScaleControl({ maxWidth: 120, unit: "metric" })
    );

    map.on("load", () => {
      map.addSource("heatmap-source", {
        type: "geojson",
        data: emptyGeoJSON,
      });

      map.addLayer({
        id: "heatmap-layer",
        type: "heatmap",
        source: "heatmap-source",
        maxzoom: 12,
        paint: {
          "heatmap-weight": [
            "interpolate",
            ["linear"],
            ["coalesce", ["get", "weight"], 0],
            0,
            0,
            0.5,
            1,
          ],
          "heatmap-intensity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            4,
            0.3,
            12,
            1.2,
          ],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(37,99,235,0)",
            0.15,
            "rgba(37,99,235,0.7)",
            0.35,
            "rgba(16,185,129,0.85)",
            0.55,
            "rgba(250,204,21,0.9)",
            0.75,
            "rgba(249,115,22,0.95)",
            1,
            "rgba(239,68,68,0.98)",
          ],
          "heatmap-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            4,
            12,
            10,
            40,
          ],
          "heatmap-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            4,
            0.9,
            12,
            0,
          ],
        },
      });

      map.addLayer({
        id: "heatmap-points",
        type: "circle",
        source: "heatmap-source",
        minzoom: 8,
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "point_count"],
            1,
            6,
            50,
            18,
          ],
          "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "weight"],
            0,
            "#38bdf8",
            0.1,
            "#22d3ee",
            0.2,
            "#84cc16",
            0.3,
            "#facc15",
            0.4,
            "#fb923c",
            0.5,
            "#ef4444",
          ],
          "circle-opacity": 0.85,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#0f172a",
        },
      });

      map.fitBounds(DEFAULT_COUNTRY_BBOX, {
        padding: 40,
        duration: 0,
      });

      layersReady = true;
      layersReady = true;
      applyIntensityFilter();

      // Initial load
      fetchHeatmap(DEFAULT_COUNTRY_BBOX);
      // Don't fetch companies initially for the whole country (too large)
      renderCompanies([], null);
      setCompaniesState("Apropie harta pentru a vedea companiile", "muted");

      // Debounce logic
      let moveEndTimeout;
      map.on("moveend", () => {
        if (moveEndTimeout) clearTimeout(moveEndTimeout);
        moveEndTimeout = setTimeout(() => {
          const currentBBox = getCurrentBBox();
          if (!currentBBox) return;

          fetchHeatmap(currentBBox);

          // Check size before fetching companies
          const width = currentBBox[2] - currentBBox[0];
          const height = currentBBox[3] - currentBBox[1];

          if (width > 1.5 || height > 1.5) {
            renderCompanies([], null);
            setCompaniesState("Apropie harta pentru a vedea companiile", "muted");
          } else {
            fetchCompanies(currentBBox);
          }
        }, 500); // Wait 500ms after movement stops
      });
      hotspotPopup = new maplibregl.Popup({
        closeButton: false,
        closeOnMove: true,
        offset: 16,
        className: "hotspot-popup",
      });

      map.on("click", "heatmap-points", (event) => {
        const feature = event.features && event.features[0];
        if (!feature || !hotspotPopup) return;
        hotspotPopup
          .setLngLat(event.lngLat)
          .setHTML(buildPopupHTML(feature))
          .addTo(map);
      });

      map.on("mouseenter", "heatmap-points", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "heatmap-points", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    map.on("error", (event) => {
      console.error("Eroare MapLibre:", event.error);
      setStatus("Detectorul de hotspot-uri a intampinat o eroare.", "error");
    });

    if (pendingRegionKey) {
      const key = pendingRegionKey;
      pendingRegionKey = null;
      focusRegion(key);
    }
  }

  regionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const regionKey = button.dataset.region;
      focusRegion(regionKey);
      // Close dropdown after selection
      const regionList = document.getElementById("region-list");
      const toggleBtn = document.getElementById("region-dropdown-toggle");
      if (regionList && toggleBtn) {
        regionList.style.display = "none";
        toggleBtn.classList.remove("active");
      }
    });
  });

  // Region dropdown toggle
  const regionDropdownToggle = document.getElementById("region-dropdown-toggle");
  const regionList = document.getElementById("region-list");
  if (regionDropdownToggle && regionList) {
    regionDropdownToggle.addEventListener("click", () => {
      const isVisible = regionList.style.display === "block";
      regionList.style.display = isVisible ? "none" : "block";
      regionDropdownToggle.classList.toggle("active", !isVisible);
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".region-dropdown")) {
        regionList.style.display = "none";
        regionDropdownToggle.classList.remove("active");
      }
    });
  }

  // City Search Functionality
  const citySearchInput = document.getElementById("city-search-input");
  const citySearchBtn = document.getElementById("city-search-btn");
  const searchStatus = document.getElementById("search-status");

  function setSearchStatus(message, type = "loading") {
    if (!searchStatus) return;
    searchStatus.textContent = message;
    searchStatus.className = `search-status visible ${type}`;

    if (type === "success" || type === "error") {
      setTimeout(() => {
        searchStatus.classList.remove("visible");
      }, 4000);
    }
  }

  async function searchCity(cityName) {
    if (!cityName || !cityName.trim()) {
      setSearchStatus("Te rog introdu un nume de oras", "error");
      return;
    }

    setSearchStatus("Cautam orasul...", "loading");

    try {
      // Using Nominatim (OpenStreetMap) geocoding service
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("q", cityName);
      url.searchParams.set("countrycodes", "ro"); // Restrict to Romania
      url.searchParams.set("format", "json");
      url.searchParams.set("limit", "1");
      url.searchParams.set("addressdetails", "1");

      const response = await fetch(url.toString(), {
        headers: {
          "User-Agent": "LoveLinux++ Zebra Hack Map Application"
        }
      });

      if (!response.ok) {
        throw new Error("Eroare la cautarea orasului");
      }

      const results = await response.json();

      if (!results || results.length === 0) {
        setSearchStatus(`Nu am gasit orasul "${cityName}" in Romania`, "error");
        return;
      }

      const location = results[0];
      const lat = parseFloat(location.lat);
      const lon = parseFloat(location.lon);
      const displayName = location.display_name;

      if (!map) {
        setSearchStatus("Harta nu este inca incarcata", "error");
        return;
      }

      // Navigate to the city
      map.flyTo({
        center: [lon, lat],
        zoom: 11,
        duration: 2000,
        essential: true
      });

      setSearchStatus(`Navigam la ${location.address?.city || location.address?.town || location.address?.village || cityName}`, "success");

      // Clear the selected region
      selectedRegionKey = null;
      highlightRegionButtons();

    } catch (error) {
      console.error("City search error:", error);
      setSearchStatus("Nu am putut cauta orasul. Incearca din nou.", "error");
    }
  }

  if (citySearchBtn && citySearchInput) {
    citySearchBtn.addEventListener("click", () => {
      const cityName = citySearchInput.value.trim();
      searchCity(cityName);
    });

    citySearchInput.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        const cityName = citySearchInput.value.trim();
        searchCity(cityName);
      }
    });
  }


  const toggleBtn = document.getElementById("toggle-overlay");
  const mapOverlay = document.getElementById("map-overlay");
  if (toggleBtn && mapOverlay) {
    toggleBtn.addEventListener("click", () => {
      console.log("Toggle button clicked");
      const isVisible = mapOverlay.classList.toggle("visible");
      toggleBtn.classList.toggle("active", isVisible);
    });
  }

  intensityInputs.forEach((input) => {
    const key = input.dataset.intensity;
    if (key in intensityState) {
      input.checked = intensityState[key];
    }
    input.addEventListener("change", () => {
      intensityState[key] = input.checked;
      applyIntensityFilter();
    });
  });

  // Analytics Context Transfer
  const analyzeBtn = document.getElementById("btn-analyze-context");
  if (analyzeBtn) {
    analyzeBtn.addEventListener("click", () => {
      // Save the current top 10 companies to leverage in analytics
      const topCompanies = allCompanies.slice(0, 10);
      localStorage.setItem("zebra_context_companies", JSON.stringify(topCompanies));
    });
  }

  setStatus(defaultStatusText, "idle");
  updateOperatorsList(emptyGeoJSON);
  setCompaniesState("Muta harta sau selecteaza o regiune pentru a incepe", "muted");
  initMap();
})();
