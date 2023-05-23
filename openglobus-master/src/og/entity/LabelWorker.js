"use strict";

// import { QueueArray } from '../QueueArray.js';

import { BaseWorker } from "../utils/BaseWorker.js";

export const LOCK_UPDATE = -2;
export const LOCK_FREE = -1;

class LabelWorker extends BaseWorker {
    constructor(numWorkers = 4) {
        super(numWorkers, _programm);
        this._source = new Map();
    }

    _onMessage(e) {
        let s = this._source.get(e.data.id);

        if (s.label._lockId === LOCK_UPDATE) {
            requestAnimationFrame(() => {
                this.make({ handler: s.handler, label: s.label });
            });
        } else {
            s.handler.workerCallback(e.data, s.label);
        }

        this._source.delete(e.data.id);
    }


    make(data) {
        let label = data.label,
            handler = data.handler;

        if (handler._entityCollection) {

            if (this._workerQueue.length) {
                var w = this._workerQueue.pop();

                this._source.set(this._id, data);

                let labelData = new Float32Array([
                    /*0*/this._id++,
                    /*1*/handler._maxLetters,
                    /*2*/label.getVisibility() ? 1 : 0,
                    /*3, 4, 5*/label._positionHigh.x, label._positionHigh.y, label._positionHigh.z,
                    /*6, 7, 8*/label._positionLow.x, label._positionLow.y, label._positionLow.z,
                    /*9*/label._size,
                    /*10, 11, 12*/label._offset.x, label._offset.y, label._offset.z,
                    /*13, 14, 15, 16*/label._color.x, label._color.y, label._color.z, label._color.w,
                    /*17*/label._rotation,
                    /*18, 19, 20*/label._alignedAxis.x, label._alignedAxis.y, label._alignedAxis.z,
                    /*21*/label._fontIndex,
                    /*22*/label._outline,
                    /*23, 24, 25, 26*/label._outlineColor.x, label._outlineColor.y, label._outlineColor.z, label._outlineColor.w,
                    /*27, 28, 29*/label._entity._pickingColor.x, label._entity._pickingColor.y, label._entity._pickingColor.z
                ]);

                label._lockId = this._id;

                w.postMessage({
                    labelData: labelData
                }, [
                    labelData.buffer,
                ]);
            } else {
                this._pendingQueue.push(data);
            }
        }
    }
}

const _programm = `'use strict';

    function concatTypedArrays(dest, index, source) {
        let len = source.length,
            offset = index * len;
        for(let i = 0; i < len; i++) {
            dest[offset + i] = source[i];
        }
    }

    self.onmessage = function (e) {
        var labelData = e.data.labelData,
            id = labelData[0],
            maxLetters = labelData[1],
            isVisible = labelData[2],
            /*3, 4, 5*/_positionHigh_x = labelData[3], _positionHigh_y = labelData[4], _positionHigh_z = labelData[5],
            /*6, 7, 8*/_positionLow_x = labelData[6], _positionLow_y = labelData[7], _positionLow_z = labelData[8],
            /*9*/_size = labelData[9],
            /*10, 11, 12*/_offset_x = labelData[10], _offset_y = labelData[11], _offset_z = labelData[12],
            /*13, 14, 15, 16*/_color_x = labelData[13], _color_y = labelData[14], _color_z = labelData[15], _color_w = labelData[16],
            /*17*/_rotation = labelData[17],
            /*18, 19, 20*/_alignedAxis_x = labelData[18], _alignedAxis_y = labelData[19], _alignedAxis_z = labelData[20],
            /*21*/_fontIndex = labelData[21],
            /*22*/_outline = labelData[22],
            /*23, 24, 25, 26*/_outlineColor_x = labelData[23], _outlineColor_y = labelData[24], _outlineColor_z = labelData[25], _outlineColor_w = labelData[26],
            /*27, 28, 29*/_pickingColor_x = labelData[27], _pickingColor_y = labelData[28], _pickingColor_z = labelData[29]
         

        let _vertexArr = new Float32Array(maxLetters * 12),
            _texCoordArr = new Float32Array(maxLetters * 24),
            _gliphParamArr = new Float32Array(maxLetters * 24),
            _positionHighArr = new Float32Array(maxLetters * 18),
            _positionLowArr = new Float32Array(maxLetters * 18),
            _sizeArr = new Float32Array(maxLetters * 6),
            _offsetArr = new Float32Array(maxLetters * 18),
            _rgbaArr = new Float32Array(maxLetters * 24),
            _rotationArr = new Float32Array(maxLetters * 6),
            _alignedAxisArr = new Float32Array(maxLetters * 18),
            _fontIndexArr = new Float32Array(maxLetters * 6),
            _outlineArr = new Float32Array(maxLetters * 6),
            _outlineColorArr = new Float32Array(maxLetters * 24),
            _pickingColorArr = new Float32Array(maxLetters * 18);
        
        for (var i = 0; i < maxLetters; i++) {
            if (isVisible !== 0) {
                concatTypedArrays(_vertexArr, i, [0, 0, 0, -1, 1, -1, 1, -1, 1, 0, 0, 0]);
            } else {
                concatTypedArrays(_vertexArr, i, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
            }

            concatTypedArrays(_texCoordArr, i, [0, 0, -1, 0, 0, 0, -1, 0, 0, 0, -1, 0, 0, 0, -1, 0, 0, 0, -1, 0, 0, 0, -1, 0]);
            concatTypedArrays(_gliphParamArr, i, [1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0]);

            var x = _positionHigh_x, y = _positionHigh_y, z = _positionHigh_z, w;
            concatTypedArrays(_positionHighArr, i, [x, y, z, x, y, z, x, y, z, x, y, z, x, y, z, x, y, z]);

            x = _positionLow_x; y = _positionLow_y; z = _positionLow_z;
            concatTypedArrays(_positionLowArr, i, [x, y, z, x, y, z, x, y, z, x, y, z, x, y, z, x, y, z]);

            x = _size;
            concatTypedArrays(_sizeArr, i, [x, x, x, x, x, x]);

            x = _offset_x; y = _offset_y; z = _offset_z;
            concatTypedArrays(_offsetArr, i, [x, y, z, x, y, z, x, y, z, x, y, z, x, y, z, x, y, z]);

            x = _color_x; y = _color_y; z = _color_z; w = _color_w;
            concatTypedArrays(_rgbaArr, i, [x, y, z, w, x, y, z, w, x, y, z, w, x, y, z, w, x, y, z, w, x, y, z, w]);

            x = _rotation;
            concatTypedArrays(_rotationArr, i, [x, x, x, x, x, x]);

            x = _alignedAxis_x; y = _alignedAxis_y; z = _alignedAxis_z;
            concatTypedArrays(_alignedAxisArr, i, [x, y, z, x, y, z, x, y, z, x, y, z, x, y, z, x, y, z]);

            x = _fontIndex;
            concatTypedArrays(_fontIndexArr, i, [x, x, x, x, x, x]);

            x = _outline;
            concatTypedArrays(_outlineArr, i, [x, x, x, x, x, x]);

            x = _outlineColor_x; y = _outlineColor_y; z = _outlineColor_z; w = _outlineColor_w;
            concatTypedArrays(_outlineColorArr, i, [x, y, z, w, x, y, z, w, x, y, z, w, x, y, z, w, x, y, z, w, x, y, z, w]);

            x = _pickingColor_x / 255; y = _pickingColor_y / 255; z = _pickingColor_z / 255;
            concatTypedArrays(_pickingColorArr, i, [x, y, z, x, y, z, x, y, z, x, y, z, x, y, z, x, y, z]);
        }

        self.postMessage({
                id: id,
                vertexArr: _vertexArr,
                texCoordArr: _texCoordArr,
                gliphParamArr: _gliphParamArr,
                positionHighArr: _positionHighArr,
                positionLowArr: _positionLowArr,
                sizeArr: _sizeArr,
                offsetArr: _offsetArr,
                rgbaArr: _rgbaArr,
                rotationArr: _rotationArr,
                alignedAxisArr: _alignedAxisArr,
                fontIndexArr: _fontIndexArr,
                outlineArr: _outlineArr,
                outlineColorArr: _outlineColorArr,
                pickingColorArr: _pickingColorArr
             }, [
                    _vertexArr.buffer,
                    _texCoordArr.buffer,
                    _gliphParamArr.buffer,
                    _positionHighArr.buffer,
                    _positionLowArr.buffer,
                    _sizeArr.buffer,
                    _offsetArr.buffer,
                    _rgbaArr.buffer,
                    _rotationArr.buffer,
                    _alignedAxisArr.buffer,
                    _fontIndexArr.buffer,
                    _outlineArr.buffer,
                    _outlineColorArr.buffer,
                    _pickingColorArr.buffer
            ]);
    }`;

export { LabelWorker };