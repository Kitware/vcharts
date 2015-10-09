(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.vcharts = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var libs = require('./libs');

var templates = {
    bar: require('../templates/bar.json'),
    box: require('../templates/box.json'),
    bullet: require('../templates/bullet.json'),
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

var chart = function (type, initialOptions) {
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

},{"../templates/bar.json":3,"../templates/box.json":4,"../templates/bullet.json":5,"../templates/histogram.json":6,"../templates/vega.json":7,"../templates/xy.json":8,"../templates/xymatrix.json":9,"./libs":2}],2:[function(require,module,exports){
module.exports = {
    d3: d3,
    vg: vg
};

},{}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
module.exports=[
    "@defaults",
    [
        ["group", "key"],
        ["boxSize", 0.75],
        ["capSize", 0.5]
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
                "name": "y",
                "points": true,
                "padding": 1,
                "range": "height",
                "domain": {"data": "table", "field": "name", "sort": true},
                "type": "ordinal",
                "round": true
            },
            {
                "name": "ybar",
                "range": "height",
                "domain": {"data": "table", "field": "name", "sort": true},
                "type": "ordinal",
                "round": true
            },
            {
                "name": "x",
                "nice": true,
                "range": "width",
                "domain": {"data": "table", "field": "value"},
                "type": "linear",
                "round": true
            }
        ],
        "axes": [
            {"type": "x", "scale": "x"},
            {"type": "y","scale": "y"}
        ],
        "marks": [
            {
                "type": "rect",
                "from": {"data": "calcs"},
                "properties": {
                    "enter": {
                        "x": {"field": "lower", "scale": "x"},
                        "x2": {"field": "upper", "scale": "x"},
                        "yc": {"field": "name", "scale": "y"},
                        "height": {"value": 1},
                        "fill": {"value": "#888"}
                    }
                }
            },
            {
                "type": "rect",
                "from": {"data": "calcs"},
                "properties": {
                    "enter": {
                        "x": {"scale": "x", "field": "q1_value"},
                        "x2": {"scale": "x", "field": "q3_value"},
                        "yc": {"scale": "y", "field": "name"},
                        "height": {"scale": "ybar", "band": true, "mult": ["@get", "boxSize"]},
                        "fill": {"value": ["@get", "fill", "white"]},
                        "stroke": {"value": "#888"}
                    }
                }
            },
            {
                "type": "rect",
                "from": {"data": "calcs"},
                "properties": {
                    "enter": {
                        "x": {"scale": "x", "field": "median_value"},
                        "width": {"value": 2},
                        "yc": {"scale": "y", "field": "name"},
                        "height": {"scale": "ybar", "band": true, "mult": ["@get", "boxSize"]},
                        "fill": {"value": "#000"}
                    }
                }
            },
            {
                "type": "rect",
                "from": {"data": "calcs"},
                "properties": {
                    "enter": {
                        "x": {"scale": "x", "field": "lower"},
                        "width": {"value": 1},
                        "yc": {"scale": "y", "field": "name"},
                        "height": {"scale": "ybar", "band": true, "mult": ["@get", "capSize"]},
                        "fill": {"value": "#000"}
                    }
                }
            },
            {
                "type": "rect",
                "from": {"data": "calcs"},
                "properties": {
                    "enter": {
                        "x": {"scale": "x", "field": "upper"},
                        "width": {"value": 1},
                        "yc": {"scale": "y", "field": "name"},
                        "height": {"scale": "ybar", "band": true, "mult": ["@get", "capSize"]},
                        "fill": {"value": "#000"}
                    }
                }
            },
            {
                "type": "symbol",
                "from": {"data": "calcs"},
                "properties": {
                    "enter": {
                        "x": {"scale": "x", "field": "min_value"},
                        "yc": {"scale": "y", "field": "name"},
                        "size": {"value": 20},
                        "stroke": {"value": "#000"},
                        "fill": {"value": "#fff"},
                        "opacity": {"field": "min_value_opacity"}
                    }
                }
            },
            {
                "type": "symbol",
                "from": {"data": "calcs"},
                "properties": {
                    "enter": {
                        "x": {"scale": "x", "field": "max_value"},
                        "yc": {"scale": "y", "field": "name"},
                        "size": {"value": 20},
                        "stroke": {"value": "#000"},
                        "fill": {"value": "#fff"},
                        "opacity": {"field": "max_value_opacity"}
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

},{}],6:[function(require,module,exports){
module.exports=[
    "@defaults",
    [
        ["bin", "value"],
        ["discrete", false]
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
        "scales": [
            {
                "name": "x",
                "type": "ordinal",
                "range": "width",
                "sort": false,
                "domain": {
                    "data": "series",
                    "field": "bin",
                    "sort": true
                }
            },
            {
                "name": "y",
                "type": "linear",
                "range": "height",
                "zero": true,
                "domain": {
                    "data": "series",
                    "field": "count"
                }
            }
        ],
        "axes": [
            {
                "type": "x",
                "scale": "x",
                "layer": "back",
                "title": ["@get", "xAxis.title", ""],
                "properties": {
                    "labels": {
                        "text": {
                            "template": [
                                "@if",
                                ["@get", "discrete", false],
                                "{{datum.data}}",
                                "{{datum.data|number:'.2g'}}"
                            ]
                        }
                    }
                }
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
                        "x": {"scale": "x", "field": "bin", "offset": 1},
                        "width": {"scale": "x", "band": true, "offset": -1},
                        "y": {"scale": "y", "field": "count"},
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

},{}],7:[function(require,module,exports){
module.exports=["@get", "spec"]

},{}],8:[function(require,module,exports){
module.exports=[
    "@defaults",
    [
        ["width", 800],
        ["height", 500]
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
                "name": "width", "init": ["@get", "width"]
            },
            {
                "name": "height", "init": ["@get", "height"]
            },
            {
                "name": "d",
                "init": {},
                "streams": [
                    { "type": "symbol:mouseover", "expr": "datum" },
                    { "type": "symbol:mouseout", "expr": "{}" }
                ]
            },
            {
                "name": "point",
                "init": 0,
                "streams": [
                    {
                        "type": "mousedown",
                        "expr": "{x: eventX(), y: eventY()}"
                    }
                ]
            },
            {
                "name": "delta",
                "init": 0,
                "streams": [
                    {
                        "type": "[mousedown, window:mouseup] > window:mousemove",
                        "expr": "{x: point.x - eventX(), y: eventY() - point.y}"
                    }
                ]
            },
            {
                "name": "xAnchor",
                "init": 0,
                "streams": [
                    {
                        "type": "mousemove, wheel",
                        "expr": "eventX()",
                        "scale": { "name": "x", "invert": true }
                    }
                ]
            },
            {
                "name": "yAnchor",
                "init": 0,
                "streams": [
                    {
                        "type": "mousemove, wheel",
                        "expr": "eventY()",
                        "scale": {"name": "y", "invert": true}
                    }
                ]
            },
            {
                "name": "zoom",
                "init": 1.0,
                "streams": [
                    {
                        "type": "wheel",
                        "expr": "pow(1.001, event.deltaY)"
                    }
                ]
            },
            {
                "name": "xMinAnchor",
                "streams": [
                    {
                        "type": "mousedown, mouseup, wheel",
                        "expr": "0",
                        "scale": {"name": "x", "invert": true}
                    }
                ]
            },
            {
                "name": "xMaxAnchor",
                "streams": [
                    {
                        "type": "mousedown, mouseup, wheel",
                        "expr": "width",
                        "scale": {"name": "x", "invert": true}
                    }
                ]
            },
            {
                "name": "yMinAnchor",
                "streams": [
                    {
                        "type": "mousedown, mouseup, wheel",
                        "expr": "height",
                        "scale": {"name": "y", "invert": true}
                    }
                ]
            },
            {
                "name": "yMaxAnchor",
                "streams": [
                    {
                        "type": "mousedown, mouseup, wheel",
                        "expr": "0",
                        "scale": {"name": "y", "invert": true}
                    }
                ]
            },
            {
                "name": "xMin",
                "init": ["@get", "xAxis.range.0", null],
                "streams": [
                    {
                        "type": "delta",
                        "expr": [
                            "@if",
                            ["@get", "xAxis.pan", true],
                            [
                                "@if",
                                ["@eq", ["@get", "xAxis.type"], "time"],
                                "time(xMinAnchor) + (time(xMaxAnchor)-time(xMinAnchor))*delta.x/width",
                                "xMinAnchor + (xMaxAnchor-xMinAnchor)*delta.x/width"
                            ],
                            "xMinAnchor"
                        ]
                    },
                    {
                        "type": "zoom",
                        "expr": [
                            "@if",
                            ["@get", "xAxis.zoom", true],
                            [
                                "@if",
                                ["@eq", ["@get", "xAxis.type"], "time"],
                                "(time(xMinAnchor)-time(xAnchor))*zoom + time(xAnchor)",
                                "(xMinAnchor-xAnchor)*zoom + xAnchor"
                            ],
                            "xMinAnchor"
                        ]
                    }
                ]
            },
            {
                "name": "xMax",
                "init": ["@get", "xAxis.range.1", null],
                "streams": [
                    {
                        "type": "delta",
                        "expr": [
                            "@if",
                            ["@get", "xAxis.pan", true],
                            [
                                "@if",
                                ["@eq", ["@get", "xAxis.type"], "time"],
                                "time(xMaxAnchor) + (time(xMaxAnchor)-time(xMinAnchor))*delta.x/width",
                                "xMaxAnchor + (xMaxAnchor-xMinAnchor)*delta.x/width"
                            ],
                            "xMaxAnchor"
                        ]
                    },
                    {
                        "type": "zoom",
                        "expr": [
                            "@if",
                            ["@get", "xAxis.zoom", true],
                            [
                                "@if",
                                ["@eq", ["@get", "xAxis.type"], "time"],
                                "(time(xMaxAnchor)-time(xAnchor))*zoom + time(xAnchor)",
                                "(xMaxAnchor-xAnchor)*zoom + xAnchor"
                            ],
                            "xMaxAnchor"
                        ]
                    }
                ]
            },
            {
                "name": "yMin",
                "init": ["@get", "yAxis.range.0", null],
                "streams": [
                    {
                        "type": "delta",
                        "expr": [
                            "@if",
                            ["@get", "yAxis.pan", true],
                            "yMinAnchor + (yMaxAnchor-yMinAnchor)*delta.y/height",
                            "yMinAnchor"
                        ]
                    },
                    {
                        "type": "zoom",
                        "expr": [
                            "@if",
                            ["@get", "yAxis.zoom", true],
                            [
                                "@if",
                                ["@eq", ["@get", "yAxis.type"], "time"],
                                "(yMinAnchor-time(yAnchor))*zoom + time(yAnchor)",
                                "(yMinAnchor-yAnchor)*zoom + yAnchor"
                            ],
                            "yMinAnchor"
                        ]
                    }
                ]
            },
            {
                "name": "yMax",
                "init": ["@get", "yAxis.range.1", null],
                "streams": [
                    {
                        "type": "delta",
                        "expr": [
                            "@if",
                            ["@get", "yAxis.pan", true],
                            "yMaxAnchor + (yMaxAnchor-yMinAnchor)*delta.y/height",
                            "yMaxAnchor"
                        ]
                    },
                    {
                        "type": "zoom",
                        "expr": [
                            "@if",
                            ["@get", "yAxis.zoom", true],
                            [
                                "@if",
                                ["@eq", ["@get", "yAxis.type"], "time"],
                                "(yMaxAnchor-time(yAnchor))*zoom + time(yAnchor)",
                                "(yMaxAnchor-yAnchor)*zoom + yAnchor"
                            ],
                            "yMaxAnchor"
                        ]
                    }
                ]
            }
        ],
        "scales": [
            {
                "name": "x",
                "type": ["@get", "xAxis.type", "linear"],
                "range": "width",
                "zero": false,
                "domain": {
                    "fields": [
                        "@map",
                        ["@get", "series"],
                        "s",
                        {
                            "data": ["@get", "s.name"],
                            "field": "x"
                        }
                    ]
                },
                "domainMin": {"signal": "xMin"},
                "domainMax": {"signal": "xMax"}
            },
            {
                "name": "y",
                "type": ["@get", "yAxis.type", "linear"],
                "range": "height",
                "zero": false,
                "domain": {
                    "fields": [
                        "@map",
                        ["@get", "series"],
                        "s",
                        {
                            "data": ["@get", "s.name"],
                            "field": "y"
                        }
                    ]
                },
                "domainMin": {"signal": "yMin"},
                "domainMax": {"signal": "yMax"}
            },
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
        "axes": [
            {
                "type": "x",
                "scale": "x",
                "grid": true,
                "layer": "back",
                "title": ["@get", "xAxis.title", ""]
            },
            {
                "type": "y",
                "scale": "y",
                "grid": true,
                "layer": "back",
                "title": ["@get", "yAxis.title", ""]
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
                                            "strokeWidth": {"value": ["@get", "d.strokeWidth", 0.25]},
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

},{}],9:[function(require,module,exports){
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
