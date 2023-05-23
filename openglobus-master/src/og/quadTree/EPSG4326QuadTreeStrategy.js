"use strict";
import { Extent } from "../Extent.js";
import { EPSG4326 } from "../proj/EPSG4326.js";
import { Node } from "../quadTree/Node.js";
import * as quadTree from "../quadTree/quadTree.js";
import { SegmentLonLatWgs84 } from "../segment/SegmentLonLatWgs84.js";
import { QuadTreeStrategy } from "./QuadTreeStrategy.js";

export class EPSG4326QuadTreeStrategy extends QuadTreeStrategy {
    constructor(options = {}) {
        super(options);
        this.name = "EPSG4326";
        this.projection = EPSG4326;
    }

    init() {
        let earthQuadTreeSouth = new Node(SegmentLonLatWgs84, this.planet, quadTree.NW, null, 0, 0,
            Extent.createFromArray([-180, -90, 0, 90])
        );
        let earthQuadTreeWest = new Node(SegmentLonLatWgs84, this.planet, quadTree.NW, null, 0, 0,
            Extent.createFromArray([0, -90, 180, 90])
        );
        this._quadTreeList.push(earthQuadTreeSouth);
        this._quadTreeList.push(earthQuadTreeWest);
    }
}