import Draw from 'ol/interaction/Draw.js';
import Map from 'ol/Map.js';
import Overlay from 'ol/Overlay.js';
import View from 'ol/View.js';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style.js';
import {LineString, Polygon} from 'ol/geom.js';
import {OSM, Vector as VectorSource} from 'ol/source.js';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer.js';
import {getArea, getLength} from 'ol/sphere.js';
import {unByKey} from 'ol/Observable.js';
import {fromLonLat} from 'ol/proj.js';
import proj4 from 'proj4';
import {register} from 'ol/proj/proj4.js';
import Projection from 'ol/proj/Projection.js';
import WMTS from 'ol/source/WMTS.js';
import WMTSTileGrid from 'ol/tilegrid/WMTS.js';
import {get as getProjection} from 'ol/proj.js';
import {getTopLeft, getWidth} from 'ol/extent.js';

const projection = getProjection('EPSG:3857');
const projectionExtent = projection.getExtent();
const size = getWidth(projectionExtent) / 256;
const resolutions = new Array(19);
const matrixIds = new Array(19);

for (let z = 0; z < 19; ++z) {
  // generate resolutions and matrixIds arrays for this WMTS
  resolutions[z] = size / Math.pow(2, z);
  matrixIds[z] = z;
}

const raster = new TileLayer({
  source: new OSM(),
});

//base on sample https://openlayers.org/en/latest/examples/wmts.html
//nlsc wmts info https://maps.nlsc.gov.tw/S09SOA/

const wmts = new TileLayer({
  opacity: 1.0,
  source: new WMTS({
    url: 'https://wmts.nlsc.gov.tw/wmts',
    layer: 'EMAP',
    matrixSet: 'GoogleMapsCompatible',
    format: 'image/jpeg',
    projection: projection,
    tileGrid: new WMTSTileGrid({
      origin: getTopLeft(projectionExtent),
      resolutions: resolutions,
      matrixIds: matrixIds,
    }),
    style: 'default',
    wrapX: false,
  }),
});
//console.log(wmts);
//https://wmts.nlsc.gov.tw/97/wmts?SERVICE=WMTS&REQUEST=GetCapabilities&VERSION=1.0.0
const nlscGrid = new WMTSTileGrid(
  {
      origin: [50000.0, 3000000.0],
      matrixIds: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
      resolutions:
      [
          11811779.57593862 * 0.00028,
          9449423.660750896 * 0.00028,
          4724711.830375448 * 0.00028,
          2362355.915187724 * 0.00028,
          944942.3660750897 * 0.00028,
          472471.18303754483 * 0.00028,
          236235.59151877242 * 0.00028,
          94494.23660750895 * 0.00028,
          47247.118303754476 * 0.00028,
          23623.559151877238 * 0.00028,
          9449.423660750896 * 0.00028,
          4724.711830375448 * 0.00028,
          2362.355915187724 * 0.00028,
          944.9423660750896 * 0.00028
      ]
  });
const wmts97 = new TileLayer({
  opacity: 1.0,
  source: new WMTS({
    url: 'https://wmts.nlsc.gov.tw/97/wmts',
    layer: 'EMAP3826',
    style: 'default',
    matrixSet: 'default028mm',
    format: 'image/jpeg',
    projection: 'EPSG:3826',
    tileGrid: nlscGrid,
    style: 'default',
    wrapX: false,
  }),
});

const source = new VectorSource();

const vector = new VectorLayer({
  source: source,
  style: {
    'fill-color': 'rgba(255, 255, 255, 0.2)',
    'stroke-color': '#ffcc33',
    'stroke-width': 2,
    'circle-radius': 7,
    'circle-fill-color': '#ffcc33',
  },
});

/**
 * Currently drawn feature.
 * @type {import("../src/ol/Feature.js").default}
 */
let sketch;

/**
 * The help tooltip element.
 * @type {HTMLElement}
 */
let helpTooltipElement;

/**
 * Overlay to show the help messages.
 * @type {Overlay}
 */
let helpTooltip;

/**
 * The measure tooltip element.
 * @type {HTMLElement}
 */
let measureTooltipElement;

/**
 * Overlay to show the measurement.
 * @type {Overlay}
 */
let measureTooltip;

/**
 * Message to show when the user is drawing a polygon.
 * @type {string}
 */
const continuePolygonMsg = 'Click to continue drawing the polygon';

/**
 * Message to show when the user is drawing a line.
 * @type {string}
 */
const continueLineMsg = 'Click to continue drawing the line';

/**
 * Handle pointer move.
 * @param {import("../src/ol/MapBrowserEvent").default} evt The event.
 */
const pointerMoveHandler = function (evt) {
  if (evt.dragging) {
    return;
  }
  /** @type {string} */
  let helpMsg = 'Click to start drawing';

  if (sketch) {
    const geom = sketch.getGeometry();
    if (geom instanceof Polygon) {
      helpMsg = continuePolygonMsg;
    } else if (geom instanceof LineString) {
      helpMsg = continueLineMsg;
    }
  }

  helpTooltipElement.innerHTML = helpMsg;
  helpTooltip.setPosition(evt.coordinate);

  helpTooltipElement.classList.remove('hidden');
};

//定義 EPSG:3826
proj4.defs("EPSG:3826", "+proj=tmerc +lat_0=0 +lon_0=121 +k=0.9999 +x_0=250000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
register(proj4);

//https://openlayers.org/en/latest/examples/wms-image-custom-proj.html
const projection_3826 = new Projection({
  code: 'EPSG:3826',
  extent: [-461216.18,1919958.4,527443.61,3000502.9],
});

const map = new Map({
  layers: [raster, wmts97, vector],
  //layers: [raster, wmts, vector],
  //layers: [raster, vector],
  target: 'map',
  view: new View({
    projection: projection_3826,
    center: fromLonLat([121.16687, 24.954232], projection_3826),
    zoom: 13
  }),
});


map.on('pointermove', pointerMoveHandler);

map.getViewport().addEventListener('mouseout', function () {
  helpTooltipElement.classList.add('hidden');
});

const typeSelect = document.getElementById('type');

let draw; // global so we can remove it later

function euclideanDistance(coord1, coord2) {
  const dx = coord2[0] - coord1[0];
  const dy = coord2[1] - coord1[1];
  return Math.sqrt(dx * dx + dy * dy);
}

function getLineStringLength(lineString) {
  const coordinates = lineString.getCoordinates();
  let length = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    length += euclideanDistance(coordinates[i], coordinates[i + 1]);
  }
  return length;
}

/**
 * Format length output.
 * @param {LineString} line The line.
 * @return {string} The formatted length.
 */
const formatLength = function (line) {
  //console.log(line);
  //https://openlayers.org/en/latest/apidoc/module-ol_geom_LineString-LineString.html#getLength
  //Return the length of the linestring on projected plane.
  const length = line.getLength();
  /*
  //https://openlayers.org/en/latest/apidoc/module-ol_sphere.html#.getLength
  const length2 = getLength(line, {projection: 'EPSG:3826',radius:6378137});
  const length3 = getLength(line, {projection: 'EPSG:3857',radius:6371008.8});
  console.log("getLength - " + length);
  console.log("epsg:3826 - " + length2);
  console.log("epsg:3857 - " + length3);
  */

  let output;
  if (length > 100) {
    output = Math.round((length / 1000) * 100) / 100 + ' ' + 'km';
  } else {
    output = Math.round(length * 100) / 100 + ' ' + 'm';
  }
  return output;
};

/**
 * Format area output.
 * @param {Polygon} polygon The polygon.
 * @return {string} Formatted area.
 */
const formatArea = function (polygon) {
  //https://openlayers.org/en/latest/apidoc/module-ol_geom_Polygon-Polygon.html#getArea
  const area = polygon.getArea();
  /*
  //https://openlayers.org/en/latest/apidoc/module-ol_sphere.html#.getArea
  const area2 = getArea(polygon, {projection: 'EPSG:3826',radius:6378137});
  const area3 = getArea(polygon, {projection: 'EPSG:3857',radius:6371008.8});

  console.log("getArea - " + area);
  console.log("epsg:3826 - " + area2);
  console.log("epsg:3857 - " + area3);  
  */

  let output;
  if (area > 10000) {
    output = Math.round((area / 1000000) * 100) / 100 + ' ' + 'km<sup>2</sup>';
  } else {
    output = Math.round(area * 100) / 100 + ' ' + 'm<sup>2</sup>';
  }
  return output;
};

const style = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 0.2)',
  }),
  stroke: new Stroke({
    color: 'rgba(0, 0, 0, 0.5)',
    lineDash: [10, 10],
    width: 2,
  }),
  image: new CircleStyle({
    radius: 5,
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 0.7)',
    }),
    fill: new Fill({
      color: 'rgba(255, 255, 255, 0.2)',
    }),
  }),
});

function addInteraction() {
  const type = typeSelect.value == 'area' ? 'Polygon' : 'LineString';
  draw = new Draw({
    source: source,
    type: type,
    style: function (feature) {
      const geometryType = feature.getGeometry().getType();
      if (geometryType === type || geometryType === 'Point') {
        return style;
      }
    },
  });
  map.addInteraction(draw);

  createMeasureTooltip();
  createHelpTooltip();

  let listener;
  draw.on('drawstart', function (evt) {
    // set sketch
    sketch = evt.feature;

    /** @type {import("../src/ol/coordinate.js").Coordinate|undefined} */
    let tooltipCoord = evt.coordinate;

    listener = sketch.getGeometry().on('change', function (evt) {
      const geom = evt.target;
      let output;
      if (geom instanceof Polygon) {
        output = formatArea(geom);
        tooltipCoord = geom.getInteriorPoint().getCoordinates();
      } else if (geom instanceof LineString) {
        output = formatLength(geom);
        tooltipCoord = geom.getLastCoordinate();
      }
      measureTooltipElement.innerHTML = output;
      measureTooltip.setPosition(tooltipCoord);
    });
  });

  draw.on('drawend', function () {
    measureTooltipElement.className = 'ol-tooltip ol-tooltip-static';
    measureTooltip.setOffset([0, -7]);
    // unset sketch
    sketch = null;
    // unset tooltip so that a new one can be created
    measureTooltipElement = null;
    createMeasureTooltip();
    unByKey(listener);
  });
}

/**
 * Creates a new help tooltip
 */
function createHelpTooltip() {
  if (helpTooltipElement) {
    helpTooltipElement.parentNode.removeChild(helpTooltipElement);
  }
  helpTooltipElement = document.createElement('div');
  helpTooltipElement.className = 'ol-tooltip hidden';
  helpTooltip = new Overlay({
    element: helpTooltipElement,
    offset: [15, 0],
    positioning: 'center-left',
  });
  map.addOverlay(helpTooltip);
}

/**
 * Creates a new measure tooltip
 */
function createMeasureTooltip() {
  if (measureTooltipElement) {
    measureTooltipElement.parentNode.removeChild(measureTooltipElement);
  }
  measureTooltipElement = document.createElement('div');
  measureTooltipElement.className = 'ol-tooltip ol-tooltip-measure';
  measureTooltip = new Overlay({
    element: measureTooltipElement,
    offset: [0, -15],
    positioning: 'bottom-center',
    stopEvent: false,
    insertFirst: false,
  });
  map.addOverlay(measureTooltip);
}

/**
 * Let user change the geometry type.
 */
typeSelect.onchange = function () {
  map.removeInteraction(draw);
  addInteraction();
};

addInteraction();