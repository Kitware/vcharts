(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.vcharts = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var libs = require('./libs');

var templates = {
    axis: require('../templates/axis.json'),
    bar: require('../templates/bar.json'),
    box: require('../templates/box.json'),
    bullet: require('../templates/bullet.json'),
    gantt: require('../templates/gantt.json'),
    histogram: require('../templates/histogram.json'),
    vega: require('../templates/vega.json'),
    xy: require('../templates/xy.json'),
    xymatrix: require('../templates/xymatrix.json')
};

var d3 = libs.d3;
var vg = libs.vg;

var getNestedRec = function (spec, parts) {
    if (spec === undefined || parts.length === 0) {
        return spec;
    }
    return getNestedRec(spec[parts[0]], parts.slice(1));
};

var getNested = function (spec, name) {
    return getNestedRec(spec, name.split('.'));
};

var setNestedRec = function (spec, parts, value) {
    if (parts.length === 1) {
        spec[parts[0]] = value;
        return;
    }
    if (spec[parts[0]] === undefined) {
        spec[parts[0]] = {};
    }
    setNestedRec(spec[parts[0]], parts.slice(1), value);
};

var setNested = function (spec, name, value) {
    setNestedRec(spec, name.split('.'), value);
};

var templateFunctions = {
    defaults: function (args, options, scope) {
        var index, value;
        for (index = 0; index < args[0].length; index += 1) {
            value = getNested(scope, args[0][index][0]);
            if (value === undefined) {
                value = getNested(options, args[0][index][0]);
            }
            if (value === undefined) {
                value = transform(args[0][index][1], options, scope);
                setNested(scope, args[0][index][0], value);
            }
        }
        return transform(args[1], options, scope);
    },

    let: function (args, options, scope) {
        var index, value;
        for (index = 0; index < args[0].length; index += 1) {
            value = transform(args[0][index][1], options, scope);
            setNested(scope, args[0][index][0], value);
        }
        return transform(args[1], options, scope);
    },

    get: function (args, options, scope) {
        var value;
        value = getNested(scope, args[0]);
        if (value === undefined) {
            value = getNested(options, args[0]);
        }
        if (value === undefined) {
            value = transform(args[1], options, scope);
        }
        if (value === undefined) {
            value = null;
        }
        return value;
    },

    map: function (args, options, scope) {
        var transformed = [],
            elements = transform(args[0], options, scope),
            elementIndex,
            itemIndex,
            element;

        for (elementIndex = 0; elementIndex < elements.length; elementIndex += 1) {
            scope[args[1]] = elements[elementIndex];
            for (itemIndex = 2; itemIndex < args.length; itemIndex += 1) {
                element = transform(args[itemIndex], options, scope);
                if (element !== null) {
                    transformed.push(element);
                }
            }
        }
        return transformed;
    },

    if: function (args, options, scope) {
        var condition = transform(args[0], options, scope);
        if (condition) {
            return transform(args[1], options, scope);
        }
        return transform(args[2], options, scope);
    },

    eq: function (args, options, scope) {
        var a = transform(args[0], options, scope),
            b = transform(args[1], options, scope);
        return (a === b);
    },

    min: function (args, options, scope) {
        var array = transform(args[0], options, scope),
            field = transform(args[1], options, scope);
        return d3.min(array, function (d) {
            return getNested(d, field);
        });
    },

    max: function (args, options, scope) {
        var array = transform(args[0], options, scope),
            field = transform(args[1], options, scope);
        return d3.max(array, function (d) {
            return getNested(d, field);
        });
    },

    join: function (args, options, scope) {
        var i, join, arr, result = "";
        sep = transform(args[0], options, scope);
        arr = transform(args[1], options, scope);
        for (i = 0; i < arr.length; i += 1) {
            if (i > 0) {
                result += sep;
            }
            result += arr[i];
        }
        return result;
    },

    merge: function (args, options, scope) {
        var i, merged = transform(args[0], options, scope);
        for (i = 1; i < args.length; i += 1) {
            merged = merge(merged, transform(args[i], options, scope));
        }
        return merged;
    },

    apply: function (args, options, scope) {
        var templateName = transform(args[0], options, scope),
            templateOptions = transform(args[1], options, scope);
        return transform(templates[templateName], templateOptions);
    },

    orient: function (args, options, scope) {
        var dir = transform(args[0], options, scope),
            obj = transform(args[1], options, scope),
            key,
            transformed = {},
            mapping = {
                x: 'y',
                x2: 'y2',
                xc: 'yc',
                y: 'x',
                y2: 'x2',
                yc: 'xc',
                width: 'height',
                height: 'width'
            };
        if (dir === 'horizontal') {
            return obj;
        }
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (mapping[key]) {
                    transformed[mapping[key]] = obj[key];
                } else {
                    transformed[key] = obj[key];
                }
            }
        }
        return transformed;
    }
};

var transform = function (spec, options, scope) {
    var transformed,
        index,
        key;

    options = options || {};
    scope = scope || {};

    if (Array.isArray(spec)) {
        if (spec.length > 0 && (typeof spec[0] === 'string') && spec[0].slice(0, 1) === '@') {
            return templateFunctions[spec[0].slice(1)](spec.slice(1), options, scope);
        }
        transformed = [];
        for (index = 0; index < spec.length; index += 1) {
            transformed.push(transform(spec[index], options, scope));
        }
        return transformed;
    }
    if (spec === null) {
        return spec;
    }
    if (typeof spec === 'object') {
        transformed = {};
        for (key in spec) {
            if (spec.hasOwnProperty(key)) {
                transformed[key] = transform(spec[key], options, scope);
            }
        }
        return transformed;
    }
    return spec;
};

var isObjectLiteral = function (object) {
    return object && object.constructor && object.constructor.name === 'Object';
};

var isArrayLiteral = function (object) {
    return object && object.constructor && object.constructor.name === 'Array';
};

var extend = function (defaults, options) {
    var extended,
        prop,
        index;
    if (options === undefined) {
        return defaults;
    }
    if (isObjectLiteral(defaults)) {
        extended = {};
        for (prop in defaults) {
            if (Object.prototype.hasOwnProperty.call(defaults, prop)) {
                extended[prop] = extend(defaults[prop], options[prop]);
            }
        }
        for (prop in options) {
            if (!Object.prototype.hasOwnProperty.call(defaults, prop)) {
                extended[prop] = options[prop];
            }
        }
        return extended;
    }
    if (isArrayLiteral(defaults)) {
        extended = [];
        for (index = 0; index < defaults.length; index += 1) {
            extended.push(extend(defaults[index], options[index]));
        }
        if (isArrayLiteral(options)) {
            for (index = defaults.length; index < options.length; index += 1) {
                extended.push(options[index]);
            }
        }
        return extended;
    }
    return options;
};

var merge = function (defaults, options) {
    var extended,
        prop,
        index;
    if (options === undefined) {
        return defaults;
    }
    if (isObjectLiteral(defaults)) {
        extended = {};
        for (prop in defaults) {
            if (Object.prototype.hasOwnProperty.call(defaults, prop)) {
                extended[prop] = merge(defaults[prop], options[prop]);
            }
        }
        for (prop in options) {
            if (!Object.prototype.hasOwnProperty.call(extended, prop)) {
                extended[prop] = options[prop];
            }
        }
        return extended;
    }
    if (isArrayLiteral(defaults)) {
        extended = [];
        for (index = 0; index < defaults.length; index += 1) {
            extended.push(defaults[index]);
        }
        if (isArrayLiteral(options)) {
            for (index = 0; index < options.length; index += 1) {
                extended.push(options[index]);
            }
        }
        return extended;
    }
    return defaults;
};

var chart = function (type, initialOptions, done) {
    var that = {};

    that.options = {};
    that.template = templates[type];

    that.update = function (newOptions) {
        var vegaOptions, spec, sizeOptions, curOptions, el;

        that.options = extend(that.options, newOptions);

        // Transform pass 1 to get the padding
        spec = transform(that.template, that.options);

        // Use padding and element size to set size, unless
        // size explicitly specified or element size is zero.
        el = d3.select(that.options.el)[0][0];
        sizeOptions = {};
        if (el.offsetWidth !== 0 && el.offsetHeight !== 0) {
            if (that.options.width === undefined) {
                sizeOptions.width = el.offsetWidth;
                if (spec.padding) {
                    sizeOptions.width -= spec.padding.left + spec.padding.right;
                }
            }
            if (that.options.height === undefined) {
                sizeOptions.height = el.offsetHeight;
                if (spec.padding) {
                    sizeOptions.height -= spec.padding.top + spec.padding.bottom;
                }
            }
        }
        curOptions = extend(that.options, sizeOptions);

        // Options that go directly to Vega runtime
        vegaOptions = {
            el: curOptions.el,
            renderer: curOptions.renderer
        };

        // Transform pass 2 to get the final visualization
        that.spec = transform(that.template, curOptions);

        vg.parse.spec(that.spec, function (chartObj) {
            var chart = chartObj(vegaOptions);
            chart.update();
            if (done) {
                done(chart);
            }
        });
    };

    that.update(initialOptions);

    return that;
};

module.exports = {
    transform: transform,
    chart: chart,
    templates: templates
};

},{"../templates/axis.json":3,"../templates/bar.json":4,"../templates/box.json":5,"../templates/bullet.json":6,"../templates/gantt.json":7,"../templates/histogram.json":8,"../templates/vega.json":9,"../templates/xy.json":10,"../templates/xymatrix.json":11,"./libs":2}],2:[function(require,module,exports){
module.exports = {
    d3: d3,
    vg: vg
};

},{}],3:[function(require,module,exports){
module.exports=[
    "@let",
    [
        [
            "event",
            ["@if", ["@eq", ["@get", "axis"], "x"], "eventX()", "eventY()"]
        ],
        ["sizeSignal", ["@join", "", [["@get", "axis"], "size"]]],
        ["pointSignal", ["@join", "", [["@get", "axis"], "point"]]],
        ["deltaSignal", ["@join", "", [["@get", "axis"], "delta"]]],
        ["anchorSignal", ["@join", "", [["@get", "axis"], "anchor"]]],
        ["zoomSignal", ["@join", "", [["@get", "axis"], "zoom"]]],
        ["minAnchorSignal", ["@join", "", [["@get", "axis"], "minanchor"]]],
        ["maxAnchorSignal", ["@join", "", [["@get", "axis"], "maxanchor"]]],
        ["minSignal", ["@join", "", [["@get", "axis"], "min"]]],
        ["maxSignal", ["@join", "", [["@get", "axis"], "max"]]]
    ],
    {
        "signals": [
            {
                "name": ["@get", "sizeSignal"],
                "init": ["@get", "size"]
            },
            {
                "name": ["@get", "pointSignal"],
                "init": 0,
                "streams": [
                    {
                        "type": "mousedown",
                        "expr": ["@get", "event"]
                    }
                ]
            },
            {
                "name": ["@get", "deltaSignal"],
                "init": 0,
                "streams": [
                    {
                        "type": "[mousedown, window:mouseup] > window:mousemove",
                        "expr": [
                            "@join",
                            "",
                            [
                                "@if", ["@eq", ["@get", "axis"], "x"],
                                [["@get", "pointSignal"], " - ", ["@get", "event"]],
                                [["@get", "event"], " - ", ["@get", "pointSignal"]]
                            ]
                        ]
                    }
                ]
            },
            {
                "name": ["@get", "anchorSignal"],
                "init": 0,
                "streams": [
                    {
                        "type": "mousemove, wheel",
                        "expr": ["@get", "event"],
                        "scale": {"name": ["@get", "axis"], "invert": true}
                    }
                ]
            },
            {
                "name": ["@get", "zoomSignal"],
                "init": 1.0,
                "streams": [
                    {
                        "type": "wheel",
                        "expr": "pow(1.001, event.deltaY)"
                    }
                ]
            },
            {
                "name": ["@get", "minAnchorSignal"],
                "streams": [
                    {
                        "type": "mousedown, mouseup, wheel",
                        "expr": [
                            "@if", ["@eq", ["@get", "axis"], "x"],
                            "0",
                            ["@get", "sizeSignal"]
                        ],
                        "scale": {"name": ["@get", "axis"], "invert": true}
                    }
                ]
            },
            {
                "name": ["@get", "maxAnchorSignal"],
                "streams": [
                    {
                        "type": "mousedown, mouseup, wheel",
                        "expr": [
                            "@if", ["@eq", ["@get", "axis"], "x"],
                            ["@get", "sizeSignal"],
                            "0"
                        ],
                        "scale": {"name": ["@get", "axis"], "invert": true}
                    }
                ]
            },
            {
                "name": ["@get", "minSignal"],
                "init": ["@get", "domain.0", null],
                "streams": [
                    {
                        "type": ["@get", "deltaSignal"],
                        "expr": [
                            "@if",
                            ["@get", "pan", true],
                            [
                                "@if",
                                ["@eq", ["@get", "type"], "time"],
                                ["@join", "", ["time(", ["@get", "minAnchorSignal"], ") + (time(", ["@get", "maxAnchorSignal"], ")-time(", ["@get", "minAnchorSignal"], "))*", ["@get", "deltaSignal"], "/", ["@get", "sizeSignal"]]],
                                ["@join", "", [["@get", "minAnchorSignal"], " + (", ["@get", "maxAnchorSignal"], "-", ["@get", "minAnchorSignal"], ")*", ["@get", "deltaSignal"], "/", ["@get", "sizeSignal"]]]
                            ],
                            ["@get", "minAnchorSignal"]
                        ]
                    },
                    {
                        "type": ["@get", "zoomSignal"],
                        "expr": [
                            "@if",
                            ["@get", "zoom", true],
                            [
                                "@if",
                                ["@eq", ["@get", "type"], "time"],
                                ["@join", "", ["(time(", ["@get", "minAnchorSignal"], ")-time(", ["@get", "anchorSignal"], "))*", ["@get", "zoomSignal"], " + time(", ["@get", "anchorSignal"], ")"]],
                                ["@join", "", ["(", ["@get", "minAnchorSignal"], "-", ["@get", "anchorSignal"], ")*", ["@get", "zoomSignal"], " + ", ["@get", "anchorSignal"]]]
                            ],
                            ["@get", "minAnchorSignal"]
                        ]
                    }
                ]
            },
            {
                "name": ["@get", "maxSignal"],
                "init": ["@get", "domain.1", null],
                "streams": [
                    {
                        "type": ["@get", "deltaSignal"],
                        "expr": [
                            "@if",
                            ["@get", "pan", true],
                            [
                                "@if",
                                ["@eq", ["@get", "type"], "time"],
                                ["@join", "", ["time(", ["@get", "maxAnchorSignal"], ") + (time(", ["@get", "maxAnchorSignal"], ")-time(", ["@get", "minAnchorSignal"], "))*", ["@get", "deltaSignal"], "/", ["@get", "sizeSignal"]]],
                                ["@join", "", [["@get", "maxAnchorSignal"], " + (", ["@get", "maxAnchorSignal"], "-", ["@get", "minAnchorSignal"], ")*", ["@get", "deltaSignal"], "/", ["@get", "sizeSignal"]]]
                            ],
                            ["@get", "maxAnchorSignal"]
                        ]
                    },
                    {
                        "type": ["@get", "zoomSignal"],
                        "expr": [
                            "@if",
                            ["@get", "zoom", true],
                            [
                                "@if",
                                ["@eq", ["@get", "type"], "time"],
                                ["@join", "", ["(time(", ["@get", "maxAnchorSignal"], ")-time(", ["@get", "anchorSignal"], "))*", ["@get", "zoomSignal"], " + time(", ["@get", "anchorSignal"], ")"]],
                                ["@join", "", ["(", ["@get", "maxAnchorSignal"], "-", ["@get", "anchorSignal"], ")*", ["@get", "zoomSignal"], " + ", ["@get", "anchorSignal"]]]
                            ],
                            ["@get", "maxAnchorSignal"]
                        ]
                    }
                ]
            }
        ],
        "scales": [
            {
                "name": ["@get", "axis"],
                "type": ["@get", "type", "linear"],
                "range": ["@if", ["@eq", ["@get", "axis"], "x"],
                    [0, ["@get", "size"]],
                    [["@get", "size"], 0]
                ],
                "points": ["@get", "points", false],
                "zero": ["@get", "zero", false],
                "padding": ["@get", "padding", 0],
                "domain": ["@get", "domain"],
                "domainMin": {"signal": ["@get", "minSignal"]},
                "domainMax": {"signal": ["@get", "maxSignal"]}
            }
        ],
        "axes": [
            {
                "type": ["@get", "axis"],
                "scale": ["@get", "axis"],
                "grid": ["@get", "grid", false],
                "layer": "back",
                "title": ["@get", "title", ""]
            }
        ]
    }
]

},{}],4:[function(require,module,exports){
module.exports=[
    "@defaults",
    [
        ["x", "x"],
        ["y", "y"]
    ],
    {
        "width": ["@get", "width", 800],
        "height": ["@get", "height", 500],
        "padding": ["@get", "padding", {"top": 20, "bottom": 50, "left": 50, "right": 10}],
        "predicates": [
            {
                "name": "tooltip",
                "type": "==",
                "operands": [{"signal": "d._id"}, {"arg": "id"}]
            }
        ],
        "data": [
            {
                "name": "series",
                "values": ["@get", "values"]
            }
        ],
        "signals": [
            {
                "name": "d",
                "init": {},
                "streams": [
                    {"type": "rect:mouseover", "expr": "datum"},
                    {"type": "rect:mouseout", "expr": "{}"}
                ]
            }
        ],
        "scales": [
            {
                "name": "x",
                "type": "ordinal",
                "range": "width",
                "domain": {
                    "data": "series",
                    "field": ["@get", "x"]
                }
            },
            {
                "name": "y",
                "type": ["@get", "yAxis.type", "linear"],
                "range": "height",
                "zero": true,
                "domain": {
                    "data": "series",
                    "field": ["@get", "y"]
                }
            }
        ],
        "axes": [
            {
                "type": "x",
                "scale": "x",
                "layer": "back",
                "title": ["@get", "xAxis.title", ""]
            },
            {
                "type": "y",
                "scale": "y",
                "layer": "back",
                "title": ["@get", "yAxis.title", ""]
            }
        ],
        "marks": [
            {
                "type": "rect",
                "from": {"data": "series"},
                "properties": {
                    "enter": {
                        "x": {"scale": "x", "field": ["@get", "x"], "offset": 1},
                        "width": {"scale": "x", "band": true, "offset": -1},
                        "y": {"scale": "y", "field": ["@get", "y"]},
                        "y2": {"scale": "y", "value": 0}
                    },
                    "update": {
                        "fill": {"value": ["@get", "fill", "steelblue"]}
                    },
                    "hover": {
                        "fill": {"value": ["@get", "hover", "red"]}
                    }
                }
            },
            {
                "type": "text",
                "properties": {
                    "enter": {
                        "align": {"value": "center"},
                        "fill": {"value": "#333"}
                    },
                    "update": {
                        "x": {"scale": "x", "signal": ["@join", "", ["d['", ["@get", "x"] , "']"]]},
                        "dx": {"scale": "x", "band": true, "mult": 0.5},
                        "y": {"scale": "y", "signal": ["@join", "", ["d['", ["@get", "y"] , "']"]], "offset": -5},
                        "text": {
                            "template": [
                                "@get",
                                "tooltip",
                                [
                                    "@join",
                                    "",
                                    [
                                        "{{d['",
                                        ["@get", "x"],
                                        "']}}: {{d['",
                                        ["@get", "y"],
                                        "']}}"
                                    ]
                                ]
                            ]
                        },
                        "fillOpacity": {
                            "rule": [
                                {
                                    "predicate": {
                                        "name": "tooltip",
                                        "id": {"value": null}
                                    },
                                    "value": 0
                                },
                                {"value": 1}
                            ]
                        }
                    }
                }
            }
        ]
    }
]

},{}],5:[function(require,module,exports){
module.exports=[
    "@defaults",
    [
        ["group", "key"],
        ["boxSize", 0.75],
        ["capSize", 0.5],
        ["orient", "horizontal"],
        ["horiz", ["@eq", ["@get", "orient"], "horizontal"]],
        ["valueAxis", ["@if", ["@get", "horiz"], "x", "y"]],
        ["categoryAxis", ["@if", ["@get", "horiz"], "y", "x"]]
    ],
    [
        "@merge",
        [
            "@apply",
            "axis",
            [
                "@merge",
                ["@if", ["@get", "horiz"], ["@get", "xAxis"], ["@get", "yAxis"]],
                {
                    "axis": ["@get", "valueAxis"],
                    "size": ["@if", ["@get", "horiz"], ["@get", "width"], ["@get", "height"]],
                    "domain": {"data": "table", "field": "value"}
                }
            ]
        ],
        [
            "@apply",
            "axis",
            [
                "@merge",
                ["@if", ["@get", "horiz"], ["@get", "yAxis"], ["@get", "xAxis"]],
                {
                    "axis": ["@get", "categoryAxis"],
                    "size": ["@if", ["@get", "horiz"], ["@get", "height"], ["@get", "width"]],
                    "type": "ordinal",
                    "points": true,
                    "padding": 1,
                    "domain": {"data": "table", "field": "name", "sort": true}
                }
            ]
        ],
        {
            "name": "boxplot",
            "height": ["@get", "height", 400],
            "padding": ["@get", "padding", {"left": 100, "right": 10, "top": 10, "bottom": 50}],
            "width": ["@get", "width", 600],
            "data": [
                {
                    "name": "table",
                    "values": ["@get", "values"],
                    "transform": [
                        {
                            "type": "fold",
                            "fields": ["@get", "fields"]
                        },
                        {
                            "type": "formula",
                            "field": "name",
                            "expr": [
                                "@if",
                                ["@eq", "key", ["@get", "group"]],
                                "datum.key",
                                [
                                    "@join",
                                    "",
                                    ["datum.key + ' ' + datum.", ["@get", "group"]]
                                ]
                            ]
                        }
                    ]
                },
                {
                    "name": "stats",
                    "source": "table",
                    "transform": [
                        {
                            "type": "aggregate",
                            "groupby": ["name"],
                            "summarize": [
                                {
                                    "field": "value",
                                    "ops": ["min","max", "median", "q1", "q3", "valid"]
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "calcs",
                    "source": "stats",
                    "transform": [
                        {"type": "formula", "field": "lower", "expr": "max(datum.min_value,datum.q1_value-1.5*(datum.q3_value-datum.q1_value))"},
                        {"type": "formula", "field": "upper", "expr": "min(datum.max_value,datum.q3_value+1.5*(datum.q3_value-datum.q1_value))"},
                        {"type": "formula", "field": "min_value_opacity", "expr": "if(datum.min_value==datum.lower,0,1)"},
                        {"type": "formula", "field": "max_value_opacity", "expr": "if(datum.max_value==datum.upper,0,1)"}
                    ]
                }
            ],
            "scales": [
                {
                    "name": "ybar",
                    "range": ["@if", ["@get", "horiz"], "height", "width"],
                    "domain": {"data": "table", "field": "name", "sort": true},
                    "type": "ordinal",
                    "round": true
                }
            ],
            "marks": [
                {
                    "type": "group",
                    "properties": {
                        "enter": {
                            "x": {"value": 0},
                            "width": {"field": {"group": "width"}},
                            "y": {"value": 0},
                            "height": {"field": {"group": "height"}},
                            "clip": {"value": true}
                        }
                    },
                    "marks": [
                        {
                            "type": "rect",
                            "from": {"data": "calcs"},
                            "properties": {
                                "update": [
                                    "@orient",
                                    ["@get", "orient"],
                                    {
                                        "x": {"field": "lower", "scale": ["@get", "valueAxis"]},
                                        "x2": {"field": "upper", "scale": ["@get", "valueAxis"]},
                                        "yc": {"field": "name", "scale": ["@get", "categoryAxis"]},
                                        "height": {"value": 1},
                                        "fill": {"value": "#888"}
                                    }
                                ]
                            }
                        },
                        {
                            "type": "rect",
                            "from": {"data": "calcs"},
                            "properties": {
                                "update": [
                                    "@orient",
                                    ["@get", "orient"],
                                    {
                                        "x": {"scale": ["@get", "valueAxis"], "field": "q1_value"},
                                        "x2": {"scale": ["@get", "valueAxis"], "field": "q3_value"},
                                        "yc": {"scale": ["@get", "categoryAxis"], "field": "name"},
                                        "height": {"scale": "ybar", "band": true, "mult": ["@get", "boxSize"]},
                                        "fill": {"value": ["@get", "fill", "white"]},
                                        "stroke": {"value": "#888"}
                                    }
                                ]
                            }
                        },
                        {
                            "type": "rect",
                            "from": {"data": "calcs"},
                            "properties": {
                                "update": [
                                    "@orient",
                                    ["@get", "orient"],
                                    {
                                        "x": {"scale": ["@get", "valueAxis"], "field": "median_value"},
                                        "width": {"value": 2},
                                        "yc": {"scale": ["@get", "categoryAxis"], "field": "name"},
                                        "height": {"scale": "ybar", "band": true, "mult": ["@get", "boxSize"]},
                                        "fill": {"value": "#000"}
                                    }
                                ]
                            }
                        },
                        {
                            "type": "rect",
                            "from": {"data": "calcs"},
                            "properties": {
                                "update": [
                                    "@orient",
                                    ["@get", "orient"],
                                    {
                                        "x": {"scale": ["@get", "valueAxis"], "field": "lower"},
                                        "width": {"value": 1},
                                        "yc": {"scale": ["@get", "categoryAxis"], "field": "name"},
                                        "height": {"scale": "ybar", "band": true, "mult": ["@get", "capSize"]},
                                        "fill": {"value": "#000"}
                                    }
                                ]
                            }
                        },
                        {
                            "type": "rect",
                            "from": {"data": "calcs"},
                            "properties": {
                                "update": [
                                    "@orient",
                                    ["@get", "orient"],
                                    {
                                        "x": {"scale": ["@get", "valueAxis"], "field": "upper"},
                                        "width": {"value": 1},
                                        "yc": {"scale": ["@get", "categoryAxis"], "field": "name"},
                                        "height": {"scale": "ybar", "band": true, "mult": ["@get", "capSize"]},
                                        "fill": {"value": "#000"}
                                    }
                                ]
                            }
                        },
                        {
                            "type": "symbol",
                            "from": {"data": "calcs"},
                            "properties": {
                                "update": [
                                    "@orient",
                                    ["@get", "orient"],
                                    {
                                        "x": {"scale": ["@get", "valueAxis"], "field": "min_value"},
                                        "yc": {"scale": ["@get", "categoryAxis"], "field": "name"},
                                        "size": {"value": 20},
                                        "stroke": {"value": "#000"},
                                        "fill": {"value": "#fff"},
                                        "opacity": {"field": "min_value_opacity"}
                                    }
                                ]
                            }
                        },
                        {
                            "type": "symbol",
                            "from": {"data": "calcs"},
                            "properties": {
                                "update": [
                                    "@orient",
                                    ["@get", "orient"],
                                    {
                                        "x": {"scale": ["@get", "valueAxis"], "field": "max_value"},
                                        "yc": {"scale": ["@get", "categoryAxis"], "field": "name"},
                                        "size": {"value": 20},
                                        "stroke": {"value": "#000"},
                                        "fill": {"value": "#fff"},
                                        "opacity": {"field": "max_value_opacity"}
                                    }
                                ]
                            }
                        }
                    ]
                }
            ]
        }
    ]
]

},{}],6:[function(require,module,exports){
module.exports=[
    "@defaults",
    [
        ["width", 300],
        ["height", 40],
        [
            "ranges",
            [
                {"min": 0, "max": 0.1, "background": "hsl(0,0%,90%)", "foreground": "rgb(102,191,103)"},
                {"min": 0.1, "max": 0.5, "background": "hsl(0,0%,75%)", "foreground": "rgb(255,179,24)"},
                {"min": 0.5, "max": 1, "background": "hsl(0,0%,60%)", "foreground": "rgb(228,0,0)"}
            ]
        ]
    ],
    {
        "width": ["@get", "width"],
        "height": ["@get", "height"],
        "padding": {
            "top": 10,
            "left": [
                "@if",
                ["@get", "title", ""],
                150,
                10
            ],
            "bottom": 30,
            "right": 10
        },
        "data": [
            {
                "name": "ranges",
                "values": ["@get", "ranges"]
            },
            {
                "name": "values",
                "values": [
                    {"value": ["@get", "value", 0]}
                ],
                "transform": [
                    {
                        "type": "formula",
                        "field": "align",
                        "expr": "if(datum.value < 0, 'left', 'right')"
                    },
                    {
                        "type": "formula",
                        "field": "dx",
                        "expr": "if(datum.value < 0, 5, -5)"
                    }
                ]
            },
            {
                "name": "markers",
                "values": ["@get", "markers", []]
            }
        ],
        "scales": [
            {
                "name": "x",
                "type": "linear",
                "range": "width",
                "domain": {"data": "ranges", "field": ["min", "max"]}
            },
            {
                "name": "y",
                "type": "linear",
                "range": [0, ["@get", "height"]],
                "domain": [0, 1]
            },
            {
                "name": "color",
                "type": "linear",
                "range": [
                    "@map",
                    ["@get", "ranges"],
                    "range",
                    ["@get", "range.foreground", "black"],
                    ["@get", "range.foreground", "black"]
                ],
                "domain": [
                    "@map",
                    ["@get", "ranges"],
                    "range",
                    ["@get", "range.min"],
                    ["@get", "range.max"]
                ]
            }
        ],
        "axes": [
            {
                "type": "x",
                "scale": "x",
                "ticks": 5,
                "properties": {
                    "axis": {
                        "stroke": {"value": "hsl(0,0%,75%)"},
                        "strokeWidth": {"value": 0.5}
                    },
                    "ticks": {
                        "stroke": {"value": "hsl(0,0%,75%)"},
                        "strokeWidth": {"value": 0.5}
                    },
                    "labels": {
                        "fontSize": {"value": ["@get", "axisFontSize", 14]}
                    }
                }
            }
        ],
        "marks": [
            {
                "type": "rect",
                "from": {"data": "ranges"},
                "properties": {
                    "enter": {
                        "x": {"scale": "x", "field": "min"},
                        "x2": {"scale": "x", "field": "max"},
                        "y": {"scale": "y", "value": 0},
                        "y2": {"scale": "y", "value": 1},
                        "fill": {"field": "background"},
                        "opacity": {"value": 0.5}
                    }
                }
            },
            {
                "type": "rect",
                "from": {"data": "markers"},
                "properties": {
                    "enter": {
                        "xc": {"scale": "x", "field": "value"},
                        "width": {"value": 2},
                        "yc": {"scale": "y", "value": 0.5},
                        "height": {"scale": "y", "value": 0.75},
                        "fill": {"scale": "color", "field": "value"}
                    }
                }
            },
            {
                "type": "rect",
                "from": {"data": "values"},
                "properties": {
                    "enter": {
                        "x": {"scale": "x", "value": 0},
                        "x2": {"scale": "x", "field": "value"},
                        "yc": {"scale": "y", "value": 0.5},
                        "height": {"scale": "y", "value": 0.5},
                        "fill": {"scale": "color", "field": "value"}
                    }
                }
            },
            {
                "type": "text",
                "properties": {
                    "enter": {
                        "x": {"value": -10},
                        "y": {"scale": "y", "value": 0.5},
                        "fontSize": {"value": ["@get", "titleFontSize", 20]},
                        "text": {"value": ["@get", "title", ""]},
                        "align": {"value": "right"},
                        "baseline": {"value": "middle"},
                        "fill": {"value": "black"}
                    }
                }
            },
            {
                "type": "text",
                "properties": {
                    "enter": {
                        "x": {"value": -10},
                        "y": {"scale": "y", "value": 0.5, "offset": 15},
                        "fontSize": {"value": ["@get", "subtitleFontSize", 12]},
                        "text": {"value": ["@get", "subtitle", ""]},
                        "align": {"value": "right"},
                        "baseline": {"value": "middle"},
                        "fill": {"value": "black"}
                    }
                }
            },
            {
                "type": "text",
                "from": {"data": "values"},
                "properties": {
                    "enter": {
                        "x": {"scale": "x", "field": "value"},
                        "dx": {"field": "dx"},
                        "y": {"scale": "y", "value": 0.5},
                        "fontSize": {"value": ["@get", "labelFontSize", 16]},
                        "text": {"template": [
                            "@get", "display", "{{datum.value|number:'.2g'}}"
                        ]},
                        "align": {"field": "align"},
                        "baseline": {"value": "middle"},
                        "fill": {"value": "white"}
                    }
                }
            }
        ]
    }
]

},{}],7:[function(require,module,exports){
module.exports={
    "width": ["@get", "width", 700],
    "height": ["@get", "height", 600],
    "data": [
        {
            "name": "data",
            "values": ["@get", "values"]
        }
    ],
    "scales": [
        {
            "name": "y",
            "type": "ordinal",
            "range": "height",
            "domain": {"data": "data", "field": "label"}
        },
        {
            "name": "x",
            "type": "linear",
            "range": "width",
            "domain": {"data": "data", "field": ["enter", "leave"]}
        },
        {
            "name": "weight",
            "type": "ordinal",
            "range": ["bold", "normal"],
            "domain": {"data": "data", "field": "level"}
        },
        {
            "name": "color",
            "type": "ordinal",
            "range": ["steelblue", "#bbb"],
            "domain": {"data": "data", "field": "level"}
        }
    ],
    "axes": [
        {
            "type": "x",
            "scale": "x",
            "values": ["@get", "xAxis.values", [0, 6, 12, 18, 24]],
            "title": ["@get", "xAxis.title", "Month"]
        }
    ],
    "marks": [
        {
            "type": "text",
            "from": {"data": "data"},
            "properties": {
                "enter": {
                    "x": {"scale": "x", "value": 0, "offset": -5},
                    "y": {"scale": "y", "field": "label"},
                    "fill": {"value": "#000"},
                    "text": {"field": "label"},
                    "font": {"value": "Helvetica Neue"},
                    "fontSize": {"value": 10},
                    "fontWeight": {"scale": "weight", "field": "level"},
                    "align": {"value": "right"},
                    "baseline": {"value": "middle"}
                }
            }
        },
        {
            "type": "rect",
            "from": {"data": "data"},
            "properties": {
                "enter": {
                    "x": {"value": 0},
                    "y": {"scale": "y", "field": "label", "offset": -1},
                    "width": {"field": {"group": "width"}},
                    "height": {"value": 1},
                    "fill": {"value": "#ccc"}
                }
            }
        },
        {
            "type": "rect",
            "from": {"data": "data"},
            "properties": {
                "enter": {
                    "x": {"scale": "x", "field": "enter"},
                    "x2": {"scale": "x", "field": "leave"},
                    "yc": {"scale": "y", "field": "label"},
                    "height": {"value": 7},
                    "fill": {"scale": "color", "field": "level"}
                }
            }
        }
    ]
}

},{}],8:[function(require,module,exports){
module.exports=[
    "@defaults",
    [
        ["bin", "value"],
        ["discrete", false],
        ["width", 800],
        ["height", 500]
    ],
    [
        "@merge",
        [
            "@apply",
            "axis",
            [
                "@merge",
                ["@get", "xAxis"],
                {
                    "axis": "x",
                    "size": ["@get", "width"],
                    "type": "ordinal",
                    "sort": false,
                    "domain": {
                        "data": "series",
                        "field": "bin",
                        "sort": true
                    }
                }
            ]
        ],
        [
            "@apply",
            "axis",
            [
                "@merge",
                ["@get", "yAxis"],
                {
                    "axis": "y",
                    "size": ["@get", "height"],
                    "type": "linear",
                    "domain": {
                        "data": "series",
                        "field": "count"
                    }
                }
            ]
        ],
        {
            "width": ["@get", "width"],
            "height": ["@get", "height"],
            "padding": ["@get", "padding", {"top": 20, "bottom": 50, "left": 50, "right": 10}],
            "predicates": [
                {
                    "name": "tooltip",
                    "type": "==",
                    "operands": [{"signal": "d._id"}, {"arg": "id"}]
                }
            ],
            "data": [
                {
                    "name": "series",
                    "values": ["@get", "values"],
                    "transform": [
                        "@if",
                        ["@get", "discrete"],
                        [
                            {
                                "type": "formula",
                                "field": "bin",
                                "expr": [
                                    "@join",
                                    "",
                                    ["datum['", ["@get", "bin"], "']"]
                                ]
                            },
                            {
                                "type": "aggregate",
                                "groupby": ["bin"],
                                "summarize": [
                                    {
                                        "field": "*",
                                        "ops": ["count"]
                                    }
                                ]
                            }
                        ],
                        [
                            {
                                "type": "bin",
                                "field": ["@get", "bin"],
                                "min": [
                                    "@min",
                                    ["@get", "values"],
                                    ["@get", "bin"]
                                ],
                                "max": [
                                    "@max",
                                    ["@get", "values"],
                                    ["@get", "bin"]
                                ],
                                "maxbins": ["@get", "maxBins", 10]
                            },
                            {
                                "type": "aggregate",
                                "groupby": ["bin"],
                                "summarize": [
                                    {
                                        "field": "*",
                                        "ops": ["count"]
                                    }
                                ]
                            }
                        ]
                    ]
                }
            ],
            "signals": [
                {
                    "name": "d",
                    "init": {},
                    "streams": [
                        {"type": "rect:mouseover", "expr": "datum"},
                        {"type": "rect:mouseout", "expr": "{}"}
                    ]
                }
            ],
            "marks": [
                {
                    "type": "group",
                    "properties": {
                        "enter": {
                            "x": {"value": 0},
                            "width": {"field": {"group": "width"}},
                            "y": {"value": 0},
                            "height": {"field": {"group": "height"}},
                            "clip": {"value": true}
                        }
                    },
                    "marks": [
                        {
                            "type": "rect",
                            "from": {"data": "series"},
                            "properties": {
                                "update": {
                                    "x": {"scale": "x", "field": "bin", "offset": 1},
                                    "width": {"scale": "x", "band": true, "offset": -1},
                                    "y": {"scale": "y", "field": "count"},
                                    "y2": {"scale": "y", "value": 0},
                                    "fill": {"value": ["@get", "fill", "steelblue"]}
                                },
                                "hover": {
                                    "fill": {"value": ["@get", "hover", "red"]}
                                }
                            }
                        },
                        {
                            "type": "text",
                            "properties": {
                                "enter": {
                                    "align": {"value": "center"},
                                    "fill": {"value": "#333"}
                                },
                                "update": {
                                    "x": {"scale": "x", "signal": "d.bin"},
                                    "dx": {"scale": "x", "band": true, "mult": 0.5},
                                    "y": {"scale": "y", "signal": "d.count", "offset": -5},
                                    "text": {"template": ["@get", "tooltip", "{{d.count}}"]},
                                    "fillOpacity": {
                                        "rule": [
                                            {
                                                "predicate": {
                                                    "name": "tooltip",
                                                    "id": {"value": null}
                                                },
                                                "value": 0
                                            },
                                            {"value": 1}
                                        ]
                                    }
                                }
                            }
                        }
                    ]
                }
            ]
        }
    ]
]

},{}],9:[function(require,module,exports){
module.exports=["@get", "spec"]

},{}],10:[function(require,module,exports){
module.exports=[
    "@defaults",
    [
        ["width", 800],
        ["height", 500]
    ],
    [
        "@merge",
        [
            "@apply",
            "axis",
            [
                "@merge",
                ["@get", "xAxis"],
                {
                    "axis": "x",
                    "size": ["@get", "width"],
                    "domain": [
                        "@get", "xAxis.domain", {
                            "fields": [
                                "@map",
                                ["@get", "series"],
                                "s",
                                {
                                    "data": ["@get", "s.name"],
                                    "field": "x"
                                }
                            ]
                        }
                    ]
                }
            ]
        ],
        [
            "@apply",
            "axis",
            [
                "@merge",
                ["@get", "yAxis"],
                {
                    "axis": "y",
                    "size": ["@get", "height"],
                    "domain": [
                        "@get", "xAxis.domain", {
                            "fields": [
                                "@map",
                                ["@get", "series"],
                                "s",
                                {
                                    "data": ["@get", "s.name"],
                                    "field": "y"
                                }
                            ]
                        }
                    ]
                }
            ]
        ],
        {
            "width": ["@get", "width"],
            "height": ["@get", "height"],
            "padding": ["@get", "padding", { "top": 10, "bottom": 50, "left": 50, "right": 150 }],
            "predicates": [
                {
                    "name": "tooltip",
                    "type": "==",
                    "operands": [{"signal": "d._id"}, {"arg": "id"}]
                }
            ],
            "data": [
                "@map",
                ["@get", "series"],
                "d",
                {
                    "name": ["@get", "d.name"],
                    "values": ["@get", "d.values"],
                    "transform": [
                        {
                            "type": "formula",
                            "field": "x",
                            "expr": [
                                "@join",
                                "",
                                ["datum['", ["@get", "d.x", "x"], "']"]
                            ]
                        },
                        {
                            "type": "formula",
                            "field": "y",
                            "expr": [
                                "@join",
                                "",
                                ["datum['", ["@get", "d.y", "y"], "']"]
                            ]
                        }
                    ]
                }
            ],
            "signals": [
                {
                    "name": "d",
                    "init": {},
                    "streams": [
                        { "type": "symbol:mouseover", "expr": "datum" },
                        { "type": "symbol:mouseout", "expr": "{}" }
                    ]
                }
            ],
            "scales": [
                {
                    "name": "color",
                    "type": "ordinal",
                    "domain": [
                        "@map",
                        ["@get", "series"],
                        "d",
                        ["@get", "d.name"]
                    ],
                    "range": [
                        "@map",
                        ["@get", "series"],
                        "d",
                        ["@get", "d.color", "steelblue"]
                    ]
                }
            ],
            "legends": [
                {
                    "fill": "color",
                    "orient": "right",
                    "properties": {
                        "symbols": {
                            "stroke": { "value": "transparent" }
                        }
                    }
                }
            ],
            "marks": [
                {
                    "type": "group",
                    "properties": {
                        "enter": {
                            "x": { "value": 0 },
                            "width": { "field": {"group": "width" } },
                            "y": { "value": 0 },
                            "height": { "field": { "group": "height" } },
                            "clip": { "value": true }
                        }
                    },
                    "marks": [
                        {
                            "type": "group",
                            "marks": [
                                "@map",
                                ["@get", "series"],
                                "d",
                                [
                                    "@if",
                                    ["@get", "d.line", false],
                                    {
                                        "type": "line",
                                        "from": {"data": ["@get", "d.name"]},
                                        "properties": {
                                            "update": {
                                                "x": {"scale": "x", "field": "x"},
                                                "y": {"scale": "y", "field": "y"},
                                                "stroke": {"scale": "color", "value": ["@get", "d.name"]},
                                                "strokeWidth": ["@get", "d.lineWidth", 1]
                                            }
                                        }
                                    },
                                    null
                                ]
                            ]
                        },
                        {
                            "type": "group",
                            "marks": [
                                "@map",
                                ["@get", "series"],
                                "d",
                                [
                                    "@if",
                                    ["@get", "d.point", true],
                                    {
                                        "type": "symbol",
                                        "from": {"data": ["@get", "d.name"]},
                                        "properties": {
                                            "update": {
                                                "x": {"scale": "x", "field": "x"},
                                                "y": {"scale": "y", "field": "y"},
                                                "fill": {"scale": "color", "value": ["@get", "d.name"]},
                                                "stroke": {"value": "#444"},
                                                "shape": {"value": ["@get", "d.shape", "circle"]},
                                                "strokeWidth": {"value": ["@get", "d.strokeWidth", 0]},
                                                "size": {"value": ["@get", "d.pointSize", 20]}
                                            },
                                            "hover": {
                                                "size": {"value": 80}
                                            }
                                        }
                                    },
                                    null
                                ]
                            ]
                        },
                        {
                            "type": "text",
                            "properties": {
                                "enter": {
                                    "align": {"value": "center"},
                                    "fill": {"value": "#333"}
                                },
                                "update": {
                                    "x": {"scale": "x", "signal": "d.x"},
                                    "y": {"scale": "y", "signal": "d.y", "offset": -10},
                                    "text": {"template": ["@get", "tooltip", "({{d.x|number:'.4g'}}, {{d.y|number:'.4g'}})"]},
                                    "fillOpacity": {
                                        "rule": [
                                            {
                                                "predicate": {
                                                    "name": "tooltip",
                                                    "id": {"value": null}
                                                },
                                                "value": 0
                                            },
                                            {"value": 1}
                                        ]
                                    }
                                }
                            }
                        }
                    ]
                }
            ]
        }
    ]
]

},{}],11:[function(require,module,exports){
module.exports=[
    "@defaults",
    [
        ["color.value", "steelblue"],
        ["color.type", "ordinal"]
    ],
    {
        "width": ["@get", "width", 600],
        "height": ["@get", "height", 600],
        "padding": [
            "@get",
            "padding",
            {
                "top": 30,
                "bottom": 10,
                "left": 100,
                "right": ["@if", ["@get", "color.field"], 100, 0]
            }
        ],
        "data": [
            {
                "name": "data",
                "values": ["@get", "values"]
            },
            {
                "name": "fields",
                "values": ["@get", "fields"]
            }
        ],
        "scales": [
            {
                "name": "gx",
                "type": "ordinal",
                "range": "width",
                "round": true,
                "domain": {"data": "fields", "field": "data"}
            },
            {
                "name": "gy",
                "type": "ordinal",
                "range": "height",
                "round": true,
                "reverse": true,
                "domain": {"data": "fields", "field": "data"}
            },
            {
                "name": "c",
                "type": ["@get", "color.type"],
                "domain": {"data": "data", "field": ["@get", "color.field"]},
                "zero": false,
                "range": [
                    "@if", ["@eq", ["@get", "color.type"], "ordinal"],
                    "category10",
                    ["yellow", "blue"]
                ]
            }
        ],
        "legends": [
            "@if",
            ["@get", "color.field"],
            [
                {
                    "fill": "c",
                    "title": ["@get", "color.field"],
                    "offset": 10,
                    "properties": {
                        "symbols": {
                            "fillOpacity": {"value": 0.5},
                            "stroke": {"value": "transparent"}
                        }
                    }
                }
            ],
            []
        ],
        "marks": [
            {
                "type": "group",
                "from": {
                    "data": "fields",
                    "transform": [{"type": "cross"}]
                },
                "properties": {
                    "enter": {
                        "x": {"scale": "gx", "field": "a.data"},
                        "y": {"scale": "gy", "field": "b.data"},
                        "width": {"scale": "gx", "band": true, "offset":-35},
                        "height": {"scale": "gy", "band": true, "offset":-35},
                        "fill": {"value": "#fff"},
                        "stroke": {"value": "#ddd"}
                    }
                },
                "scales": [
                    {
                        "name": "x",
                        "range": "width",
                        "zero": false,
                        "round": true,
                        "domain": {"data": "data", "field": {"parent": "a.data"}}
                    },
                    {
                        "name": "y",
                        "range": "height",
                        "zero": false,
                        "round": true,
                        "domain": {"data": "data", "field": {"parent": "b.data"}}
                    }
                ],
                "axes": [
                    {"type": "x", "scale": "x", "ticks": 5},
                    {"type": "y", "scale": "y", "ticks": 5}
                ],
                "marks": [
                    {
                        "type": "symbol",
                        "from": {"data": "data"},
                        "properties": {
                            "enter": {
                                "x": {"scale": "x", "field": {"datum": {"parent": "a.data"}}},
                                "y": {"scale": "y", "field": {"datum": {"parent": "b.data"}}},
                                "fill": [
                                    "@if",
                                    ["@get", "color.field"],
                                    {"scale": "c", "field": ["@get", "color.field"]},
                                    {"value": ["@get", "color.value"]}
                                ],
                                "fillOpacity": {"value": 0.5}
                            },
                            "update": {
                                "size": {"value": 36},
                                "stroke": {"value": "transparent"}
                            },
                            "hover": {
                                "size": {"value": 100},
                                "stroke": {"value": "white"}
                            }
                        }
                    }
                ]
            },
            {
                "type": "text",
                "from": {"data": "fields"},
                "properties": {
                    "enter": {
                        "x": {"value": -30},
                        "y": {"scale": "gy", "field": "data"},
                        "text": {"field": "data"},
                        "fontSize": {"value": 12},
                        "fill": {"value": "black"},
                        "align": {"value": "right"},
                        "baseline": {"value": "top"},
                        "fontWeight": {"value": "bold"}
                    }
                }
            },
            {
                "type": "text",
                "from": {"data": "fields"},
                "properties": {
                    "enter": {
                        "y": {"value": -10},
                        "x": {"scale": "gx", "field": "data"},
                        "text": {"field": "data"},
                        "fontSize": {"value": 12},
                        "fill": {"value": "black"},
                        "align": {"value": "left"},
                        "baseline": {"value": "bottom"},
                        "fontWeight": {"value": "bold"}
                    }
                }
            }
        ]
    }
]

},{}]},{},[1])(1)
});
//# sourceMappingURL=vcharts.js.map
