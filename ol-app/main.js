import './style.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import * as olProj from 'ol/proj';
import {Vector} from 'ol/source';
import * as olStyle from 'ol/style';
import * as olInteraction from 'ol/interaction';
import * as olSphere from 'ol/sphere';

//https://openlayers.org/en/latest/examples/measure.html?q=Measure

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM()
    })
  ],
  view: new View({
    center: olProj.fromLonLat([121.16687, 24.954232]),//[0, 0],
    zoom: 18
  })
});

// 創建一個繪圖源，用於存儲繪製的圖形
var source = new Vector();

// 創建一個矢量層，用於顯示繪製的圖形
var vector = new Vector({
    source: source,
    style: new olStyle.Style({
        fill: new olStyle.Fill({
            color: 'rgba(255, 255, 255, 0.2)' // 填充顏色
        }),
        stroke: new olStyle.Stroke({
            color: '#ffcc33', // 邊界顏色
            width: 2 // 邊界寬度
        }),
        image: new olStyle.Circle({
            radius: 7,
            fill: new olStyle.Fill({
                color: '#ffcc33' // 圓點顏色
            })
        })
    })
});


// 添加矢量層到地圖
//map.addLayer(vector);

// 創建一個繪製互動工具
var draw = new olInteraction.Draw({
    source: source,
    type: 'Polygon' // 指定繪製多邊形
});

// 添加繪製工具到地圖
map.addInteraction(draw);

// 當繪製結束時，計算面積
draw.on('drawend', function (event) {
    var polygon = event.feature.getGeometry();
    var area = olSphere.getArea(polygon, {projection: 'EPSG:3857'});
    console.log(polygon);
    console.log('Area: ' + area + ' square meters');
});