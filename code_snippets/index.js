window.mapBackgroundSwitcher = window.mapBackgroundSwitcher || {};

window.mapBackgroundSwitcher.init = async function (
  itemName,
  itemValue,
  sources,
  mapRegionId
) {
  var $region = $("#" + mapRegionId);
  if (!$region.data("mbs-init")) {
    $region.data("mbs-init", true);
    $region.on("spatialmapinitialized.MAP_REGION", function (event) {
      var map = apex.region(mapRegionId).call("getMapObject");
      if (!map) {
        console.error("Map could not be retrieved.");
        return;
      }
      const allSources = mergeSourcesWithDefault(sources, map);
      addSourcesToMap(map, allSources, itemName);
      const control = createLayersControl(allSources, itemName, mapRegionId);
      map.addControl(control, "top-right");
    });
  }
};

function mergeSourcesWithDefault(sources, map) {
  const defaultSource = getDefaultMapSource(map);

  let updatedSources = sources.map((s) => ({ ...s, is_default: false }));
  // Check if default source is already in the list
  const match = updatedSources.find(
    (s) => s.tiles_url === defaultSource.tiles_url
  );

  if (match) {
    match.is_default = true;
  } else {
    defaultSource.is_default = true;
    updatedSources.unshift(defaultSource);
  }

  return updatedSources;
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
        source_id: bgLayer.source,
        tiles_url: source.tiles[0],
        label: "Default Maptile",
      };
    }
  }
  return null;
}

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

      const popup = createPopupPanel(sources, itemName, map);
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

      // link the radio input to the page item value
      linkItemToRadio(itemName, map, sources);

      return this._container;
    }

    onRemove() {
      this._container.remove();
      this._map = undefined;
    }
  }

  return new LayersControl();
}

function createPopupPanel(sources, itemName, map) {
  const panel = document.createElement("div");
  panel.className = "layers-panel";

  sources.forEach((source) => {
    const label = document.createElement("label");
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "map-source-" + itemName;
    radio.value = source.source_id;

    if (source.source_id === apex.item(itemName).getValue()) {
      radio.checked = true;
    }

    radio.onchange = () => {
      apex.item(itemName).setValue(source.source_id);
      // // Update map layer visibility when selection changes
      panel.classList.remove("show");
    };

    label.appendChild(radio);
    label.append(` ${source.label}`);
    panel.appendChild(label);
  });

  return panel;
}

function linkItemToRadio(itemName, map, sources) {
  const hiddenInput = document.getElementById(itemName);

  // Cache its current value
  let _value = hiddenInput.value;

  // Override its `.value` property to watch for changes
  Object.defineProperty(hiddenInput, "value", {
    get() {
      return _value;
    },
    set(newValue) {
      _value = newValue;
      updateMapLayerVisibility(this.value, map, sources);
      // Sync radio buttons
      const radios = document.querySelectorAll(
        'input[name="map-source-' + itemName + '"]'
      );
      radios.forEach((radio) => {
        radio.checked = radio.value === newValue;
      });

      // Optional: fire a change event
      hiddenInput.dispatchEvent(new Event("change"));
    },
  });

  // Listen for radio button changes to update hidden input
  document
    .querySelectorAll('input[name="map-source-' + itemName + '"]')
    .forEach((radio) => {
      radio.addEventListener("change", function () {
        if (this.checked) {
          hiddenInput.value = this.value;
        }
      });
    });
}

function addSourcesToMap(map, sources, itemName) {
  sources.forEach((source) => {
    const sourceId = source.source_id;
    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: "raster",
        tiles: [source.tiles_url],
        tileSize: 512,
      });
    }
    map.addLayer({
      id: sourceId,
      type: "raster",
      source: sourceId,
      layout: {
        visibility: getVisibility(source, itemName, map),
      },
    });
  });
  // remove any raster that has no layout property
}

function getVisibility(source, itemName, map) {
  if (source.is_default) {
    apex.item(itemName).setValue(source.source_id);
    map
      .getStyle()
      .layers.filter((layer) => layer.type === "raster" && !layer.layout)
      // .forEach(layer => map.removeLayer(layer.id));
      .forEach((layer) =>
        map.setLayoutProperty(layer.id, "visibility", "none")
      );
    return "visible";
  }
  return "none";
}

function updateMapLayerVisibility(activeSourceId, map, sources) {
  sources.forEach((source) => {
    const visibility = source.source_id === activeSourceId ? "visible" : "none";
    map.setLayoutProperty(source.source_id, "visibility", visibility);
  });
}
