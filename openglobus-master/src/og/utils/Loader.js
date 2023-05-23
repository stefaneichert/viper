'use strict';

import { Events } from '../Events.js';

// if (window && !('createImageBitmap' in window)) {
//     window.createImageBitmap = function (blob) {
//         return new Promise((resolve, reject) => {
//             let img = document.createElement('img');
//             img.addEventListener('load', function () {
//                 resolve(this);
//             });
//             img.src = URL.createObjectURL(blob);
//         });
//     };
// }

export class Loader {

    constructor(maxRequests = 24) {

        this.MAX_REQUESTS = maxRequests;

        this.events = new Events(["loadend", "layerloadend"]);

        this._loading = 0;

        this._queue = [];//new QueueArray();

        this._senderRequestCounter = [];

        this._promises = {
            'json': r => r.json(),
            'blob': r => r.blob(),
            'arrayBuffer': r => r.arrayBuffer(),
            'imageBitmap': r => r.blob().then(
                (r) => createImageBitmap(r, {
                    premultiplyAlpha: "premultiply"
                })),
            'text': r => r.text()
        };
    }

    load(params, callback) {
        if (params.sender) {
            if (!this._senderRequestCounter[params.sender._id]) {
                this._senderRequestCounter[params.sender._id] = {
                    sender: params.sender, counter: 0, __requestCounterFrame__: null
                };
            }
            this._senderRequestCounter[params.sender._id].counter++;
        }
        this._queue.push({ 'params': params, 'callback': callback });
        this._exec();
    }

    fetch(params) {
        return fetch(params.src, params.options || {})
            .then(response => {
                if (!response.ok) {
                    throw Error(`Unable to load '${params.src}'`);
                }
                return this._promises[params.type || "blob"](response);
            })

            .then(data => {
                return { 'status': "ready", 'data': data };

            })

            .catch(err => {
                return { 'status': "error", 'msg': err.toString() };
            });
    }

    getRequestCounter(sender) {
        if (sender) {
            let r = this._senderRequestCounter[sender._id];
            if (r) {
                return r.counter;
            }
        }
        return 0;
    }

    isIdle(sender) {
        return sender.isIdle;
    }

    _checkLoadend(request, sender) {
        if (request.counter === 0 && (sender._planet._terrainCompletedActivated || !sender._planet)) {
            sender.events.dispatch(sender.events.loadend, sender);
            this.events.dispatch(this.events.layerloadend, sender);
            request.__requestCounterFrame__ = null;
        } else {
            request.__requestCounterFrame__ = requestAnimationFrame(() => {
                this._checkLoadend(request, sender);
            });
        }
    }

    _handleResponse(q, response) {
        q.callback(response);
        let sender = q.params.sender;
        if (sender && (sender.events.loadend.handlers.length || this.events.layerloadend.handlers.length)) {
            let request = this._senderRequestCounter[sender._id];
            if (request && request.counter > 0) {
                request.counter--;
                cancelAnimationFrame(request.__requestCounterFrame__);
                request.__requestCounterFrame__ = requestAnimationFrame(() => {
                    this._checkLoadend(request, sender);
                });
            }
        }
        this._exec();
    }

    _exec() {

        if (this._queue.length > 0 && this._loading < this.MAX_REQUESTS) {

            let q = this._queue.pop();

            if (!q) return;

            let p = q.params;

            if (!p.filter || p.filter(p)) {

                this._loading++;

                return fetch(p.src, p.options || {})
                    .then(response => {
                        if (!response.ok) {
                            throw Error(`Unable to load '${p.src}'`);
                        }
                        return this._promises[p.type || "blob"](response);
                    })
                    .then(data => {
                        this._loading--;
                        this._handleResponse(q, { status: "ready", data: data });
                    })
                    .catch(err => {
                        this._loading--;
                        this._handleResponse(q, { status: "error", msg: err.toString() });
                    });

            } else {
                this._handleResponse(q, { status: "abort" });
            }
        } else if (this._loading === 0) {
            this.events.dispatch(this.events.loadend);
        }
    }

    abort(sender) {

        if (this._senderRequestCounter[sender._id]) {
            this._senderRequestCounter[sender._id].counter = 0;
            cancelAnimationFrame(this._senderRequestCounter[sender._id].__requestCounterFrame__);
            this._senderRequestCounter[sender._id].__requestCounterFrame__ = null;
        }

        for (let i = 0, len = this._queue.length; i < len; i++) {
            let qi = this._queue[i];
            if (qi && sender.isEqual(qi.params.sender)) {
                qi.callback({ 'status': "abort" });
                this._queue[i] = null;
            }
        }
    }

    abortAll() {
        for (let i = 0, len = this._queue.length; i < len; i++) {
            let qi = this._queue[i];
            if (qi) {
                let sender = qi.params.sender;
                if (sender && this._senderRequestCounter[sender._id]) {
                    this._senderRequestCounter[sender._id].counter = 0;
                    cancelAnimationFrame(this._senderRequestCounter[sender._id].__requestCounterFrame__);
                    this._senderRequestCounter[sender._id].__requestCounterFrame__ = null;
                }
                qi.callback({ 'status': "abort" });
                this._queue[i] = null;
            }
        }
        this._queue = [];
    }
}