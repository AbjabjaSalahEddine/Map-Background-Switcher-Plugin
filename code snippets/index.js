window.mapBackgroundSwitcher = window.mapBackgroundSwitcher || {};

window.mapBackgroundSwitcher.init = function (
  itemName,
  itemValue,
  sources,
  mapRegionId
) {
  let tries = 0;
  const maxTries = 6;
  let map;

  function tryGetMap() {
    tries++;
    const region = apex.region(mapRegionId);

    if (region) {
      try {
        map = region.call("getMapObject");

        const defaultSource = getDefaultMapSource(map);

        // Start with the original sources
        let allSources = [...sources];

        // Check if defaultSource exists and is not already in the list
        if (
          defaultSource &&
          !sources.some((s) => s.tiles_url === defaultSource.tiles_url)
        ) {
          allSources.unshift(defaultSource); // Add default source only if not already present
        }

        // Set item value based on what's in allSources
        const matchingSource = allSources.find(
          (s) => s.tiles_url === defaultSource.tiles_url
        );
        if (matchingSource) {
          console.log(matchingSource.source_id);
          apex.item(itemName).setValue(matchingSource.source_id);
        }

        // Add sources and layers
        addSourcesToMap(map, allSources);
        const control = createLayersControl(allSources, itemName, mapRegionId);
        map.addControl(control, "top-right");

        // Set initial visibility
        setInitialLayerVisibility(
          map,
          allSources,
          apex.item(itemName).getValue()
        );
      } catch (e) {
        if (tries < maxTries) {
          setTimeout(tryGetMap, 500);
        } else {
          console.error("Failed to get map object after max tries.", e);
        }
      }
    } else {
      if (tries < maxTries) {
        setTimeout(tryGetMap, 500);
      } else {
        console.error(
          `Map region '${mapRegionId}' not found after ${maxTries} attempts.`
        );
      }
    }
  }

  tryGetMap();
};

function createLayersControl(sources, itemName, mapRegionId) {
  class LayersControl {
    onAdd(map) {
      this._map = map;

      this._container = document.createElement("div");
      this._container.className =
        "maplibregl-ctrl maplibregl-ctrl-group layers-control-container";
      this._container.style.position = "relative";

      const button = document.createElement("button");
      button.type = "button";
      button.title = "Toggle Layers";
      button.setAttribute("aria-label", "Toggle Layers");
      button.className = "a-Button a-Button--noLabel layers-button";
      button.innerHTML = `
                <span class="layers-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layers">
                        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                        <polyline points="2 17 12 22 22 17"></polyline>
                        <polyline points="2 12 12 17 22 12"></polyline>
                    </svg>
                </span>`;

      const popup = createPopupPanel(sources, itemName, mapRegionId);
      popup.className = "layers-panel";

      button.addEventListener("click", (e) => {
        e.stopPropagation();
        popup.classList.toggle("show");
      });

      document.addEventListener("click", (e) => {
        if (!this._container.contains(e.target)) {
          popup.classList.remove("show");
        }
      });

      this._container.appendChild(button);
      button.appendChild(popup);
      return this._container;
    }

    onRemove() {
      this._container.remove();
      this._map = undefined;
    }
  }

  return new LayersControl();
}

function createPopupPanel(sources, itemName, mapRegionId) {
  const panel = document.createElement("div");
  panel.className = "layers-panel";

  sources.forEach((source) => {
    console.log(source);

    const label = document.createElement("label");
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "map-source";
    radio.value = source.source_id;

    if (source.source_id === apex.item(itemName).getValue()) {
      radio.checked = true;
    }

    radio.onchange = () => {
      apex.item(itemName).setValue(source.source_id);
      // Update map layer visibility when selection changes
      updateMapLayerVisibility(source.source_id, sources, mapRegionId);
      panel.classList.remove("show");
    };

    label.appendChild(radio);
    label.append(` ${source.label}`);
    panel.appendChild(label);
  });

  return panel;
}

function getDefaultMapSource(map) {
  // Get all layers from the map
  const layers = map.getStyle().layers;

  // Find the first raster layer (typically the background)
  const bgLayer = layers.find((layer) => layer.type === "raster");

  if (bgLayer && bgLayer.source) {
    const source = map.getSource(bgLayer.source);
    if (source && source.tiles) {
      return {
        source_id: source.id,
        tiles_url: source.tiles[0],
        label: "Default Maptile",
      };
    }
  }
  map.removeLayer(bgLayer.id);
  return null;
}

function addSourcesToMap(map, sources) {
  sources.forEach((source) => {
    if (!map.getSource(source.source_id)) {
      map.addSource(source.source_id, {
        type: "raster",
        tiles: [source.tiles_url],
        tileSize: 512,
      });

      // Add layer only if it doesn't exist (skip for default background)
      if (!map.getLayer(source.source_id)) {
        map.addLayer({
          id: source.source_id,
          type: "raster",
          source: source.source_id,
          layout: {
            visibility: "none", // Hide initially
          },
        });
      }
    }
  });
}

function setInitialLayerVisibility(map, sources, activeSourceId) {
  sources.forEach((source) => {
    const visibility = source.source_id === activeSourceId ? "visible" : "none";
    if (map.getLayer(source.source_id)) {
      map.setLayoutProperty(source.source_id, "visibility", visibility);
    }
  });
}

function updateMapLayerVisibility(activeSourceId, sources, mapRegionId) {
  const region = apex.region(mapRegionId);
  map = region.call("getMapObject");
  if (map) {
    sources.forEach((source) => {
      const visibility =
        source.source_id === activeSourceId ? "visible" : "none";
      if (map.getLayer(source.source_id)) {
        map.setLayoutProperty(source.source_id, "visibility", visibility);
      }
    });
  }
}
