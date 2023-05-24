const map = L.map('map', {minZoom: 2, maxZoom: 17, worldCopyJump: false}).setView([45.631426845, 13.770929465], 15);

const OpenStreetMap_HOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>'
}).addTo(map);

const OpenStreetMap = L.tileLayer('https://tile.openstreetmap.de/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

const Stamen_Watercolor = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: 'abcd',
    minZoom: 1,
    maxZoom: 16,
    ext: 'jpg'
});

let baseMaps = {
    "OpenStreetMap": OpenStreetMap,
    "OSM Humanitarian": OpenStreetMap_HOT,
    "Stamen Watercolor": Stamen_Watercolor
};

L.control.layers(baseMaps).addTo(map);

let CircleStyle = {
    "color": "#000000",
    "weight": 1.5,
    "fillOpacity": 0.95,
    "fillColor": "#875eff"
};
let CircleStyleHover = {
    "color": "#324c6b",
    "weight": 1.5,
    "fillOpacity": 0.8,
    "fillColor": "#ff001f"
};

var sidebar = L.control.sidebar('sidebar', {
    closeButton: false,
    position: 'left'
});
map.addControl(sidebar);

setTimeout(function () {
    sidebar.show();
}, 500);

L.easyButton('<span>s</span>', function(btn, map){
    sidebar.toggle();
}).addTo(map);

function updateGeojson() {
    let placeLayer = new L.geoJSON('', {
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, CircleStyle);
        },
        onEachFeature: function (feature, layer) {
            layer.bindPopup(feature.properties.popupContent);
        },
    });

    places.forEach((element) => {
        const label = element.title;
        const type = element.types[0];
        const geom = element.geometry

        if (!geom) return;



            const popupContent = `<b>${label}</b><br>${type}`;
            const geojsonFeature = {
                type: "Feature",
                id: element.id,
                properties: {
                    name: label,
                    type: type,
                    popupContent: popupContent
                },
                geometry: geom,
            };
            placeLayer.addData(geojsonFeature);

    });
    return placeLayer
}

PlaceMarker = updateGeojson()
    PlaceMarker.addTo(map)
