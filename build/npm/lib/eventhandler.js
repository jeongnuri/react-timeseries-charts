/*
 * ESnet React Charts, Copyright (c) 2015, The Regents of the University of
 * California, through Lawrence Berkeley National Laboratory (subject
 * to receipt of any required approvals from the U.S. Dept. of
 * Energy).  All rights reserved.
 *
 * If you have questions about your rights to use or distribute this
 * software, please contact Berkeley Lab's Technology Transfer
 * Department at TTD@lbl.gov.
 *
 * NOTICE.  This software is owned by the U.S. Department of Energy.
 * As such, the U.S. Government has been granted for itself and others
 * acting on its behalf a paid-up, nonexclusive, irrevocable,
 * worldwide license in the Software to reproduce, prepare derivative
 * works, and perform publicly and display publicly.  Beginning five
 * (5) years after the date permission to assert copyright is obtained
 * from the U.S. Department of Energy, and subject to any subsequent
 * five (5) year renewals, the U.S. Government is granted for itself
 * and others acting on its behalf a paid-up, nonexclusive,
 * irrevocable, worldwide license in the Software to reproduce,
 * prepare derivative works, distribute copies to the public, perform
 * publicly and display publicly, and to permit others to do so.
 *
 * This code is distributed under a BSD style license, see the LICENSE
 * file for complete information.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _reactAddons = require("react/addons");

var _reactAddons2 = _interopRequireDefault(_reactAddons);

var _pond = require("pond");

exports["default"] = _reactAddons2["default"].createClass({

    displayName: "EventHandler",

    getInitialState: function getInitialState() {
        return {
            "isPanning": false,
            "initialPanBegin": null,
            "initialPanEnd": null,
            "initialPanPosition": null
        };
    },

    getMousePositionFromEvent: function getMousePositionFromEvent(e) {
        var target = e.currentTarget;
        var rect = target.getBoundingClientRect();
        var x = e.clientX;
        var y = e.clientY;
        return [Math.round(x), Math.round(y)];
    },

    handleScrollWheel: function handleScrollWheel(e) {
        e.preventDefault();

        var SCALE_FACTOR = 0.001;
        var scale = 1 + e.deltaY * SCALE_FACTOR;
        if (scale > 3) scale = 3;
        if (scale < 0.1) scale = 0.1;

        var xy = this.getMousePositionFromEvent(e);

        var begin = this.props.scale.domain()[0].getTime();
        var end = this.props.scale.domain()[1].getTime();
        var center = this.props.scale.invert(xy[0]).getTime();

        var beginScaled = center - parseInt((center - begin) * scale);
        var endScaled = center + parseInt((end - center) * scale);

        //Duration constraint
        var duration = (end - begin) * scale;

        if (this.props.minDuration) {
            var minDuration = parseInt(this.props.minDuration);
            if (duration < this.props.minDuration) {
                beginScaled = center - (center - begin) / (end - begin) * minDuration;
                endScaled = center + (end - center) / (end - begin) * minDuration;
            }
        }

        if (this.props.minTime && this.props.maxTime) {
            var maxDuration = this.props.maxTime.getTime() - this.props.minTime.getTime();
            if (duration > maxDuration) {
                duration = maxDuration;
            }
        }

        //Range constraint
        if (this.props.minTime && beginScaled < this.props.minTime.getTime()) {
            beginScaled = this.props.minTime.getTime();
            endScaled = beginScaled + duration;
        }

        if (this.props.maxTime && endScaled > this.props.maxTime.getTime()) {
            endScaled = this.props.maxTime.getTime();
            beginScaled = endScaled - duration;
        }

        var newBegin = new Date(beginScaled);
        var newEnd = new Date(endScaled);

        var newTimeRange = new _pond.TimeRange(newBegin, newEnd);

        if (this.props.onZoom) {
            this.props.onZoom(newTimeRange);
        }
    },

    handleMouseDown: function handleMouseDown(e) {
        var xy0 = this.getMousePositionFromEvent(e);
        var begin = this.props.scale.domain()[0].getTime();
        var end = this.props.scale.domain()[1].getTime();
        this.setState({ "isPanning": true,
            "initialPanBegin": begin,
            "initialPanEnd": end,
            "initialPanPosition": xy0 });
    },

    handleMouseMove: function handleMouseMove(e) {
        e.preventDefault();

        var xy = this.getMousePositionFromEvent(e);

        if (this.state.isPanning) {
            var xy0 = this.state.initialPanPosition;
            var timeOffset = this.props.scale.invert(xy[0]).getTime() - this.props.scale.invert(xy0[0]).getTime();

            var newBegin = this.state.initialPanBegin - timeOffset;
            var newEnd = this.state.initialPanEnd - timeOffset;
            var duration = this.state.initialPanEnd - this.state.initialPanBegin;

            //Range constraint
            if (this.props.minTime && newBegin < this.props.minTime.getTime()) {
                newBegin = this.props.minTime.getTime();
                newEnd = newBegin + duration;
            }

            if (this.props.maxTime && newEnd > this.props.maxTime.getTime()) {
                newEnd = this.props.maxTime.getTime();
                newBegin = newEnd - duration;
            }

            var newTimeRange = new _pond.TimeRange(newBegin, newEnd);

            // onZoom callback
            if (this.props.onZoom) {
                this.props.onZoom(newTimeRange);
            }
        } else {
            if (this.props.onMouseMove) {
                var rect = e.currentTarget.getBoundingClientRect();
                var time = this.props.scale.invert(Math.round(e.clientX - rect.left));

                //onMouseMove callback
                if (this.props.onMouseMove) {
                    this.props.onMouseMove(time);
                }
            }
        }
    },

    handleMouseUp: function handleMouseUp(e) {
        this.setState({ "isPanning": false,
            "initialPanPosition": null });
    },

    handleMouseOut: function handleMouseOut() {
        if (this.props.onMouseOut) {
            this.props.onMouseOut();
        }
    },

    render: function render() {
        var cursor = this.state.isPanning ? "-webkit-grabbing" : "crosshair";
        return _reactAddons2["default"].createElement(
            "g",
            { pointerEvents: "all",
                onWheel: this.handleScrollWheel,
                onMouseDown: this.handleMouseDown,
                onMouseMove: this.handleMouseMove,
                onMouseOut: this.handleMouseOut,
                onMouseUp: this.handleMouseUp },
            _reactAddons2["default"].createElement("rect", { key: "handler-hit-rect",
                style: { "opacity": 0.0, "cursor": cursor },
                x: 0, y: 0,
                width: this.props.width, height: this.props.height }),
            this.props.children
        );
    }
});
module.exports = exports["default"];