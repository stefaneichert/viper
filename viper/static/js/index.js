const map = L.map('map', {
    minZoom: 2, maxZoom: 12,
    worldCopyJump: false
}).setView([45.131426845, 13.770929465], 2);

const OpenStreetMap_HOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>'
});

const OpenStreetMap = L.tileLayer('https://tile.openstreetmap.de/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

const Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
}).addTo(map);

const Stamen_Watercolor = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: 'abcd',
    minZoom: 1,
    maxZoom: 16,
    ext: 'jpg'
});

const Thunderforest_SpinalMap = L.tileLayer('https://{s}.tile.thunderforest.com/spinal-map/{z}/{x}/{y}.png?apikey={apikey}', {
    attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    apikey: 'b3c55fb5010a4038975fd0a0f4976e64',
    maxZoom: 22
});

let baseMaps = {
    "OpenStreetMap": OpenStreetMap,
    "OSM Humanitarian": OpenStreetMap_HOT,
    "Stamen Watercolor": Stamen_Watercolor,
    "Satellite": Esri_WorldImagery,
    "SpinalMap": Thunderforest_SpinalMap
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

var rightSidebar = L.control.sidebar('sidebar-right', {
    position: 'right'
});
map.addControl(rightSidebar);

setTimeout(function () {
//    sidebar.show();
}, 500);

L.easyButton('<span><></span>', function (btn, map) {
    sidebar.toggle();
}).addTo(map);

var RouteStyle1 = {
    "color": "#888888",
    "weight": 15,
    "opacity": 0.55
};

var RouteStyle2 = {
    "color": "#888888",
    "weight": 15,
    "opacity": 0.55
};

let hovermarkers = L.layerGroup().addTo(map)


var geojson1 = L.geoJSON(routethere, {style: RouteStyle1}).addTo(map);
var geojson2 = L.geoJSON(routeback, {style: RouteStyle2}).addTo(map);

sidebar_r = document.getElementById('sidebar-right')

function whenClicked(e) {
    var visible = rightSidebar.isVisible();
    if (visible === false) rightSidebar.show()
    let id = e.target.feature.id;
    let anchor = document.getElementById('card-' + id);
    console.log(anchor)
    if (anchor) anchor.scrollIntoView({behavior: "smooth", block: "end"})
    setRightSidebar(id)
}

function setRightSidebar(id) {
    places.forEach((element) => {
        if (element.id === id) {
            const label = element.title;
            const pl_id = element.id;
            const type = element.types[0];
            let images = "";
            if (element.images !== "") images = '<br><br><img src="' + element.images[0].url + '" class="sidebar-img">';
            let popupContent = `<h1>${label}</h1><br><h3>${type}</h3>` + images;
            sidebar_r.innerHTML = popupContent;
            popupContent += getAkonData(id)
            popupContent += getAnnoData(id)
            popupContent += getTraveldata(id)

            sidebar_r.innerHTML = popupContent;
        }
    })
}

function getAkonData(id) {
    let returnme = ''
    akon.forEach((elem) => {
        if (elem.place_id === parseInt(id)) {
            let label = elem.description
            let source = '<a href="https://data.onb.ac.at/AKON/' + elem.akon_id + '" target="_blank">' + elem.source + ' (' + elem.akon_id + ')</a>'
            let type = elem.type;
            let image = '<img class="sidebar-img" src=' + elem.image + '>';
            let iiif = elem.metadata

            let returnHTML = '<br><br><h3>' + label + ' (' + type + ') </h3>From: '+ source + image
            if (iiif !== "") returnHTML += '<a href="/iiif/?manifest=' + elem.metadata + '" target="_blank">IIIF</a>'
            returnme += returnHTML
        }
    })
    return(returnme)
}

function getAnnoData(id) {
    let returnme = ''
    anno.forEach((elem) => {
        if (elem.ID === parseInt(id)) {
            let label = elem.place
            let source = '<a href="'+ elem.link + '" target="_blank">' + elem.source + ' (' + elem.title + ', ' + elem.timestamp +', p.' + elem.page+')</a>'
            let type = elem.type;
            let image = '<img class="sidebar-img" src=' + elem.image + '>';
            let iiif = elem.metadata

            let returnHTML = '<br><br><h3>' + label + ' (' + type + ') </h3>From: '+ source + image
            if (iiif !== "") returnHTML += '<a href="/iiif/?manifest=' + elem.metadata + '" target="_blank">IIIF</a>'
            returnme += returnHTML
        }
    })
    return(returnme)
}

function getTraveldata(id) {
    let returnme = ''
    travelogues.forEach((elem) => {
        if (elem.ID === parseInt(id)) {
            let label = elem.place
            let source = '<a href="'+ elem.link + '" target="_blank">' + elem.source + ' (' + elem.title + ', ' + elem.timestamp +', p.' + elem.page+')</a>'
            let type = elem.type;
            let image = ""
            if (elem.image !== "") image = '<img class="sidebar-img" src=' + elem.image + '>';
            let iiif = elem.metadata

            let returnHTML = '<br><br><h3>' + label + ' (' + type + ') </h3>From: '+ source + image
            if (iiif !== "") returnHTML += '<a href="/iiif/?manifest=' + elem.metadata + '" target="_blank">IIIF</a>'
            returnme += returnHTML
        }
    })
    return(returnme)
}

function onEachFeature(feature, layer) {
    //bind click
    layer.on({
        click: whenClicked
    });
}

function updateGeojson() {
    let placeLayer = new L.geoJSON('', {
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, CircleStyle);
        },
        onEachFeature: onEachFeature,
    });

    places.forEach((element) => {
        const label = element.title;
        const pl_id = element.id;
        const type = element.types[0];
        const geom = element.geometry
        let images = "";
        if (element.images !== "") images = '<br><br><img src="' + element.images[0].url + '" style="max-width: 150px; max-height=170px">';

        if (!geom) return;


        const popupContent = `<a href="#${pl_id}"><b>${label}</b></a><br>${type}` + images;

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
let bounds = PlaceMarker.getBounds()
map.fitBounds(bounds)

var NovaraStart = {
    strings: ['The Voyage of the Novara'],
    typeSpeed: 30,
    showCursor: true,
    onComplete: (self) => {
        var d = document.getElementsByClassName("typed-cursor")[0];
        var b = document.getElementById("begin");
        d.className += " d-none"
        setTimeout(function () {
            b.className += " d-yes"
        }, 500);
    },
};

var starttext = new Typed('#typetext', NovaraStart);

function getLanguage(data) {
    if (data.description) {
        let text = data.description;
        if (text.includes('_##')) {
            const mySubString = text.substring(
                text.indexOf(`##en_##`) + 7,
                text.lastIndexOf(`##_en##`)
            );
            text = mySubString;
        }
        return text;
    } else {
        return '';
    }
}

polyline = []
movement = []

function drawPolyline() {

    moves.forEach((element) => {
        let id = element.place_from;
        places.forEach((place) => {
            if (place.id === id) {
                if (place.geometry.coordinates) {
                    Point = new L.LatLng(place.geometry.coordinates[1], place.geometry.coordinates[0]);
                    polyline.push(Point)
                    movepoint = {'id': id, 'coords': [place.geometry.coordinates[1], place.geometry.coordinates[0]]}
                    movement.push(movepoint)
                }
            }

        })
    });
    var firstpolyline = new L.Polyline(polyline, {
        color: 'red',
        weight: 3,
        opacity: 0.5,
        smoothFactor: 1
    });
    //firstpolyline.addTo(map);
}

drawPolyline()

const allCards = document.getElementsByClassName('hovercard');
Array.from(allCards).forEach((element) => {
    element.addEventListener("mouseover", () => {
        console.log((element.id))
        setRightSidebar((element.id).replace('card-', ''));
        flyto((element.id).replace('card-', ''))
    }, false);
});

var novaraIcon = L.icon({
    iconUrl: 'static/icons/Novara.png',
    iconSize:     [80, 127], // size of the icon
    iconAnchor:   [10, 140], // point of the icon which will correspond to marker's location
});

function flyto(id) {
    movement.forEach((element) => {
        if (element.id === id) {
            hovermarkers.clearLayers()
            let hoverpoint = L.marker(element.coords, {icon: novaraIcon})
            hovermarkers.addLayer(hoverpoint)
            map.flyTo(element.coords, 6)
        }
    })
}


function getStarted() {
    toremove = document.getElementById('typetext-container')
    toremove.remove();
    map.flyTo([45.631426845, 13.770929465], 8)
    setTimeout(function () {
        sidebar.show();
    }, 500);
}



