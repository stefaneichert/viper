﻿'use strict';

import { Ellipsoid } from '../../ellipsoid/Ellipsoid.js';
import { Entity } from '../../entity/Entity.js';
import { Events } from '../../Events.js';
import { Vector } from '../../layer/Vector.js';
import { Vec2 } from '../../math/Vec2.js';
import { Object3d } from '../../Object3d.js';
import { RenderNode } from '../../scene/RenderNode.js';

const OUTLINE_COUNT = 120;

export function distanceFormat(v) {
    if (v > 1000) {
        return `${(v / 1000).toFixed(1)} km`;
    } else if (v > 9) {
        return `${Math.round(v)} m`;
    } else {
        return `${v.toFixed(1)} m`;
    }
}

let obj3d = Object3d.createCylinder(1.1, 0, 2.7, 20, 1, true, false, 0, 0, 0)

const LABEL_OPTIONS = {
    text: "",
    size: 11,
    color: "rgba(455,455,455,1.0)",
    outlineColor: "rgba(0,0,0,0.34)",
    outline: 0.23,
    align: "center",
    offset: [0, 20]
};
const RULER_CORNER_OPTIONS = {
    scale: 1,
    instanced: true,
    tag: "ruler",
    color: "rgb(0,305,0)",
    object3d: obj3d
};

class RulerScene extends RenderNode {
    constructor(options = {}) {
        super(options.name);

        this.events = new Events(EVENT_NAMES);

        this._ignoreTerrain = options.ignoreTerrain != undefined ? options.ignoreTerrain : true;

        this._planet = options.planet || null;

        this._startLonLat = null;
        this._preventClick = false;
        this._stopDrawing = false;

        this._pickedCorner = null;
        this._startPos = null;
        this._startClick = new Vec2();

        this._heading = 0;

        this._trackLayer = new Vector("track", {
            entities: [],
            pickingEnabled: false,
            polygonOffsetUnits: -1.0,
            relativeToGround: true,
            displayInLayerSwitcher: false
        });

        this._labelLayer = new Vector("ruler-label", {
            entities: [],
            pickingEnabled: false,
            polygonOffsetUnits: -100.0,
            relativeToGround: true,
            displayInLayerSwitcher: false
        });

        this._cornersLayer = new Vector("corners", {
            entities: [],
            pickingEnabled: true,
            displayInLayerSwitcher: false,
            scaleByDistance: [100, 4000000, 1.0],
            pickingScale: 2
        });
    }

    set ignoreTerrain(v) {
        this._ignoreTerrain = v;
        if (v) {
            //...redraw line
        }
    }

    bindPlanet(planet) {
        this._planet = planet;
    }

    _createCorners() {
        this._cornerEntity = [
            new Entity({
                geoObject: RULER_CORNER_OPTIONS,
                properties: {
                    name: "start"
                }
            }),
            new Entity({
                geoObject: RULER_CORNER_OPTIONS,
                properties: {
                    name: "end"
                }
            })
        ];
        this._cornersLayer.addEntities(this._cornerEntity)
    }

    init() {

        this._propsLabel = new Entity({
            'name': 'propsLabel',
            'label': LABEL_OPTIONS
        });

        this._trackEntity = new Entity({
            polyline: {
                path3v: [],
                thickness: 4.8,
                color: "rgb(255,131,0)",
                isClosed: false
            }
        });

        this._trackEntity.polyline.altitude = 0.01;

        this._createCorners();
        this._trackLayer.addEntities([this._trackEntity]);
        this._labelLayer.addEntities([this._propsLabel]);
        this._planet.addLayer(this._labelLayer);
        this._planet.addLayer(this._trackLayer);
        this._planet.addLayer(this._cornersLayer);
        this._activate();
    }

    onremove() {
        this._deactivate();
    }

    _activate() {

        this._propsLabel.label.setVisibility(false);
        this._onLclick_ = this._onLclick.bind(this);
        this.renderer.events.on("lclick", this._onLclick_, this);
        this._onMouseMove_ = this._onMouseMove.bind(this);
        this.renderer.events.on("mousemove", this._onMouseMove_, this);
        this._onLdblclick_ = this._onLdblclick.bind(this);
        this.renderer.events.on("ldblclick", this._onLdblclick_, this);

        this._onLUp_ = this._onLUp.bind(this);
        this.renderer.events.on("lup", this._onLUp_, this);

        this._onCornerEnter_ = this._onCornerEnter.bind(this);
        this._cornersLayer.events.on("mouseenter", this._onCornerEnter_, this);

        this._onCornerLeave_ = this._onCornerLeave.bind(this);
        this._cornersLayer.events.on("mouseleave", this._onCornerLeave_, this);

        this._onCornerLdown_ = this._onCornerLdown.bind(this);
        this._cornersLayer.events.on("ldown", this._onCornerLdown_, this);

        this._onCornerLup_ = this._onCornerLup.bind(this);
        this._cornersLayer.events.on("lup", this._onCornerLup, this);

        this.setVisibility(false);
    }

    _deactivate() {
        this._startLonLat = null;
        this._preventClick = false;
        this._stopDrawing = false;
        this._pickedCorner = null;
        // this._trackLayer.remove();
        // this._cornersLayer.remove();

        this.renderer.events.off("lclick", this._onLclick_);
        this.renderer.events.off("mousemove", this._onMouseMove_);
        this.renderer.events.off("lup", this._onLUp_);

        this._cornersLayer.events.off("mouseenter", this._onCornerEnter_);
        this._cornersLayer.events.off("mouseleave", this._onCornerLeave_);
        this._cornersLayer.events.off("ldown", this._onCornerLdown_);
        this._cornersLayer.events.off("lup", this._onCornerLup_);

        this.clear();

        this._onLclick_ = null;
        this._onMouseMove_ = null;
        this._onLUp_ = null;
        this._onCornerLeave_ = null;
        this._onCornerEnter_ = null;
        this._onCornerLdown_ = null;
        this._onCornerLup_ = null;
    }

    _onCornerLdown(e) {
        if (!this._startLonLat) {
            this.renderer.controls.mouseNavigation.deactivate();
            this._startClick.set(e.x, e.y);
            let coords = e.pickingObject.getCartesian();
            this._startPos = this._planet.getPixelFromCartesian(coords);
            this._pickedCorner = e.pickingObject;
            if (e.pickingObject.properties.name == "start") {
                this._anchorLonLat = this._cornerEntity[1].getLonLat().clone();
            } else {
                this._anchorLonLat = this._cornerEntity[0].getLonLat().clone();
            }
        }
    }

    _onLUp() {
        if (this._pickedCorner) {
            this.renderer.controls.mouseNavigation.activate();
            this._pickedCorner = null;
            this._anchorLonLat = null;
        }
    }

    _onCornerLup() {
        this._onLUp();
    }

    _onCornerEnter(e) {
        e.renderer.handler.canvas.style.cursor = "pointer";
    }

    _onCornerLeave(e) {
        e.renderer.handler.canvas.style.cursor = "default";
    }

    _onLdblclick() {
        this._preventClick = true;
    }

    setVisibility(visibility) {
        this._cornersLayer.setVisibility(visibility);
        this._trackLayer.setVisibility(visibility);
        this._labelLayer.setVisibility(visibility);
    }

    _onLclick(e) {
        let startLonLat = this._planet.getLonLatFromPixelTerrain(e);
        this._timeout = setTimeout(() => {
            if (!this._preventClick) {
                if (!this._startLonLat) {
                    this.setVisibility(true);
                    this._stopDrawing = false;
                    this._startLonLat = startLonLat;
                } else {
                    this._startLonLat = null;
                }
            }
            this._preventClick = false;
            this._stopDrawing = false;
            clearTimeout(this._timeout);
        }, 200);

        if (this._startLonLat) {
            this._stopDrawing = true;
        }
    }

    _drawLine(startLonLat, endLonLat, startPos) {

        if (!startPos) {
            startPos = this._planet.ellipsoid.lonLatToCartesian(startLonLat);
        }

        let endPos = this._planet.ellipsoid.lonLatToCartesian(endLonLat);

        let length = this._planet.ellipsoid.getGreatCircleDistance(startLonLat, endLonLat);
        this._heading = Ellipsoid.getRhumbBearing(startLonLat, endLonLat);

        let path = [];
        let dir = endPos.sub(startPos);
        let dist = dir.length();
        dir.normalize();

        for (let i = 0; i < OUTLINE_COUNT; i++) {
            let f = dir.scaleTo(i * dist / OUTLINE_COUNT).addA(startPos);
            path.push(f);
        }
        path.push(endPos);

        this._trackEntity.polyline.setPath3v([path]);

        if (this._ignoreTerrain) {
            this._propsLabel.setCartesian3v(path[Math.floor(path.length / 2)]);
            this._propsLabel.label.setText(`${distanceFormat(length)}, ${Math.round(this._heading)} deg`);
        }
    }

    _onMouseMove(e) {
        if (this._startLonLat && !this._stopDrawing) {
            this._propsLabel.label.setVisibility(true);
            let endLonLat = this._planet.getLonLatFromPixelTerrain(e);
            if (!endLonLat) return;
            this._drawLine(this._startLonLat, endLonLat);
        } else if (this._pickedCorner) {
            let newLonLat = this._planet.getLonLatFromPixelTerrain(e);
            if (newLonLat) {
                if (this._pickedCorner.properties.name === "start") {
                    this._drawLine(newLonLat, this._anchorLonLat);
                } else {
                    this._drawLine(this._anchorLonLat, newLonLat);
                }
            }
        }
    }

    clear() {
        this._trackEntity.remove();
        this._cornerEntity[0].remove();
        this._cornerEntity[1].remove();
        this._propsLabel.remove();
        this._planet.removeLayer(this._trackLayer);
        this._planet.removeLayer(this._cornersLayer);
    }

    isCornersPositionChanged() {
        let t = this._trackEntity.polyline.getPath3v()[0];
        if (t) {
            const startPos = t[0].clone(),
                endPos = t[t.length - 1].clone();
            return this._cornerEntity[0].getCartesian().equal(startPos) &&
                this._cornerEntity[1].getCartesian().equal(endPos)
        }
        return false
    }

    frame() {
        let t = this._trackEntity.polyline.getPath3v()[0];
        if (t) {
            const startPos = t[0].clone(),
                endPos = t[t.length - 1].clone();

            if (!this.isCornersPositionChanged()) {
                this._cornerEntity[0].setCartesian3v(startPos);
                this._cornerEntity[1].setCartesian3v(endPos);
                if (!this._ignoreTerrain) {
                    let res = 0;
                    for (let i = 0, len = t.length - 1; i < len; i++) {
                        res += t[i + 1].distance(t[i]);
                    }
                    this._propsLabel.setCartesian3v(t[Math.floor(t.length / 2)]);
                    this._propsLabel.label.setText(`${distanceFormat(res)}, ${Math.round(this._heading)} deg`);
                }
            }
        }
    }

    get ellipsoid() {
        return this._planet ? this._planet.ellipsoid : null;
    }
}

const EVENT_NAMES = [
    "add",
    "remove",
    "mousemove",
    "mouseenter",
    "mouseleave",
    "lclick",
    "rclick",
    "mclick",
    "ldblclick",
    "rdblclick",
    "mdblclick",
    "lup",
    "rup",
    "mup",
    "ldown",
    "rdown",
    "mdown",
    "lhold",
    "rhold",
    "mhold",
    "mousewheel",
    "touchmove",
    "touchstart",
    "touchend",
    "doubletouch",
    "touchleave",
    "touchenter"
];

export { RulerScene };
