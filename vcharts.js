var vcharts = {};

vcharts._getNested = function (spec, parts) {
    if (spec === undefined || parts.length === 0) {
        return spec;
    }
    return vcharts._getNested(spec[parts[0]], parts.slice(1));
}

vcharts._setNested = function (spec, parts, value) {
    if (parts.length === 1) {
        spec[parts[0]] = value;
        return;
    }
    if (spec[parts[0]] === undefined) {
        spec[parts[0]] = {};
    }
    return vcharts._setNested(spec[parts[0]], parts.slice(1));
}

vcharts.transform = function (spec, options) {
    var transformed,
        index,
        templateSpec,
        elements,
        element,
        elementIndex,
        itemIndex,
        arg1, arg2;

    if (Array.isArray(spec)) {
        transformed = [];
        for (index = 0; index < spec.length; index += 1) {
            transformed.push(vcharts.transform(spec[index], options));
        }
        return transformed;
    }
    if (spec === null) {
        return spec;
    }
    if (typeof spec === 'object') {
        if (spec['{{'] !== undefined) {
            templateSpec = spec['{{'];
            if (typeof templateSpec === 'string') {
                templateSpec = [templateSpec];
            }
            if (templateSpec.length < 2) {
                templateSpec = [templateSpec[0], null];
            }
            transformed = vcharts._getNested(options, templateSpec[0].split('.'));
            if (transformed === undefined) {
                transformed = templateSpec[1];
                vcharts._setNested(options, templateSpec[0].split('.'), templateSpec[1]);
            }
            return transformed;
        }
        if (spec['[['] !== undefined) {
            templateSpec = spec['[['];
            transformed = [];
            elements = vcharts.transform(templateSpec[0], options);
            for (elementIndex = 0; elementIndex < elements.length; elementIndex += 1) {
                options[templateSpec[1]] = elements[elementIndex];
                for (itemIndex = 2; itemIndex < templateSpec.length; itemIndex += 1) {
                    element = vcharts.transform(templateSpec[itemIndex], options);
                    if (element !== null) {
                        transformed.push(element);
                    }
                }
            }
            return transformed;
        }
        if (spec['??'] !== undefined) {
            templateSpec = spec['??'];
            condition = vcharts.transform(templateSpec[0], options);
            if (condition) {
                return vcharts.transform(templateSpec[1], options);
            }
            return vcharts.transform(templateSpec[2], options);
        }
        if (spec['=='] !== undefined) {
            templateSpec = spec['=='];
            arg1 = vcharts.transform(templateSpec[0], options);
            arg2 = vcharts.transform(templateSpec[1], options);
            return (arg1 === arg2);
        }
        transformed = {};
        for (key in spec) {
            if (spec.hasOwnProperty(key)) {
                transformed[key] = vcharts.transform(spec[key], options);
            }
        }
        return transformed;
    }
    return spec;
};

vcharts.vegaModule = function (specTemplate) {
    return function (options) {
        var spec = vcharts.transform(specTemplate, options);
        console.log(spec);
        vg.parse.spec(spec, function (chart) {
            chart({
                el: options.el,
                renderer: options.renderer || 'canvas'
            }).update();
        });
        return this;
    };
};

vcharts.bullet = vcharts.vegaModule({
    "width": {"{{": ["width", 300]},
    "height": {"{{": ["height", 40]},
    "padding": {
        "top": 10,
        "left": {
            "??": [
                {"{{": ["title", ""]},
                150,
                10
            ]
        },
        "bottom": 30,
        "right": 10},
    "data": [
        {
            "name": "ranges",
            "values": {
                "{{": [
                    "ranges",
                    [
                        {"min": 0, "max": 0.1, "background": "hsl(0,0%,90%)", "foreground": "rgb(102,191,103)"},
                        {"min": 0.1, "max": 0.5, "background": "hsl(0,0%,75%)", "foreground": "rgb(255,179,24)"},
                        {"min": 0.5, "max": 1, "background": "hsl(0,0%,60%)", "foreground": "rgb(228,0,0)"}
                    ]
                ]
            }
        },
        {
            "name": "values",
            "values": [
                {"value": {"{{": ["value", 0]}}
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
            "values": {"{{": ["markers", []]}
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
            "range": [0, {"{{": "height"}],
            "domain": [0, 1]
        },
        {
            "name": "color",
            "type": "linear",
            "range": {
                "[[": [
                    {"{{": "ranges"},
                    "range",
                    {"{{": ["range.foreground", "black"]},
                    {"{{": "range.foreground"}
                ]
            },
            "domain": {
                "[[": [
                    {"{{": "ranges"},
                    "range",
                    {"{{": "range.min"},
                    {"{{": "range.max"}
                ]
            }
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
                    "fontSize": {"value": {"{{": ["axisFontSize", 14]}}
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
                    "fontSize": {"value": {"{{": ["titleFontSize", 20]}},
                    "text": {"value": {"{{": ["title", ""]}},
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
                    "fontSize": {"value": {"{{": ["subtitleFontSize", 12]}},
                    "text": {"value": {"{{": ["subtitle", ""]}},
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
                    "fontSize": {"value": {"{{": ["labelFontSize", 16]}},
                    "text": {"template": {
                        "{{": ["display", "{{datum.value|number:'.2g'}}"]
                    }},
                    "align": {"field": "align"},
                    "baseline": {"value": "middle"},
                    "fill": {"value": "white"}
                }
            }
        }
    ]
});

vcharts.vega = vcharts.vegaModule({
    "{{": "spec"
});

vcharts.xy = vcharts.vegaModule({
    "width": { "{{": ["width", 800] },
    "height": { "{{": ["height", 500] },
    "padding": { "{{": ["padding", { "top": 10, "bottom": 50, "left": 50, "right": 150 }] },
    "predicates": [
        {
            "name": "tooltip",
            "type": "==",
            "operands": [{ "signal": "tooltip._id" }, { "arg": "id" }]
        }
    ],
    "data": {
        "[[": [
            { "{{": ["series", []] },
            "d",
            {
                "name": { "{{": "d.name" },
                "values": { "{{": "d.values" },
                "transform": [
                    {
                        "type": "formula",
                        "field": "x",
                        "expr": { "{{": ["d.x", "datum.x"] }
                    },
                    {
                        "type": "formula",
                        "field": "y",
                        "expr": { "{{": ["d.y", "datum.y"] }
                    }
                ]
            }
        ]
    },
    "signals": [
        {
            "name": "width", "init": { "{{": "width" }
        },
        {
            "name": "height", "init": { "{{": "height" }
        },
        {
            "name": "tooltip",
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
                    "type": "mousemove",
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
                    "type": "mousemove",
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
            "name": "xs",
            "streams": [
                {
                    "type": "mousedown, mouseup, wheel",
                    "expr": "{min: xMin, max: xMax}"
                }
            ]
        },
        {
            "name": "ys",
            "streams": [
                {
                    "type": "mousedown, mouseup, wheel",
                    "expr": "{min: yMin, max: yMax}"
                }
            ]
        },
        {
            "name": "xMin",
            "init": { "{{": ["axes.x.range.0", -1.6] },
            "streams": [
                {
                    "type": "delta",
                    "expr": "xs.min + (xs.max-xs.min)*delta.x/width"
                },
                {
                    "type": "zoom",
                    "expr": {
                        "??": [
                            { "{{": ["axes.x.zoom", true] },
                            {
                                "??": [
                                    { "==": [{ "{{": "axes.x.type" }, "time"] },
                                    "(xs.min-time(xAnchor))*zoom + time(xAnchor)",
                                    "(xs.min-xAnchor)*zoom + xAnchor"
                                ]
                            },
                            "xs.min"
                        ]
                    }
                }
            ]
        },
        {
            "name": "xMax",
            "init": { "{{": ["axes.x.range.1", 1.6] },
            "streams": [
                {
                    "type": "delta",
                    "expr": "xs.max + (xs.max-xs.min)*delta.x/width"
                },
                {
                    "type": "zoom",
                    "expr": {
                        "??": [
                            { "{{": ["axes.x.zoom", true] },
                            {
                                "??": [
                                    { "==": [{ "{{": "axes.x.type" }, "time"] },
                                    "(xs.max-time(xAnchor))*zoom + time(xAnchor)",
                                    "(xs.max-xAnchor)*zoom + xAnchor"
                                ]
                            },
                            "xs.max"
                        ]
                    }
                }
            ]
        },
        {
            "name": "yMin",
            "init": { "{{": ["axes.y.range.0", -1] },
            "streams": [
                {
                    "type": "delta",
                    "expr": {
                        "??": [
                            { "{{": ["axes.y.pan", true] },
                            "ys.min + (ys.max-ys.min)*delta.y/height",
                            "ys.min"
                        ]
                    }
                },
                {
                    "type": "zoom",
                    "expr": {
                        "??": [
                            { "{{": ["axes.y.zoom", true] },
                            {
                                "??": [
                                    { "==": [{ "{{": "axes.y.type" }, "time"] },
                                    "(ys.min-time(yAnchor))*zoom + time(yAnchor)",
                                    "(ys.min-yAnchor)*zoom + yAnchor"
                                ]
                            },
                            "ys.min"
                        ]
                    }
                }
            ]
        },
        {
            "name": "yMax",
            "init": { "{{": ["axes.y.range.1", 1] },
            "streams": [
                {
                    "type": "delta",
                    "expr": {
                        "??": [
                            { "{{": ["axes.y.pan", true] },
                            "ys.max + (ys.max-ys.min)*delta.y/height",
                            "ys.max"
                        ]
                    }
                },
                {
                    "type": "zoom",
                    "expr": {
                        "??": [
                            { "{{": ["axes.y.zoom", true] },
                            {
                                "??": [
                                    { "==": [{ "{{": "axes.y.type" }, "time"] },
                                    "(ys.max-time(yAnchor))*zoom + time(yAnchor)",
                                    "(ys.max-yAnchor)*zoom + yAnchor"
                                ]
                            },
                            "ys.max"
                        ]
                    }
                }
            ]
        }
    ],
    "scales": [
        {
            "name": "x",
            "type": { "{{": ["axes.x.type", "linear"] },
            "range": "width",
            "zero": false,
            "domainMin": { "signal": "xMin" },
            "domainMax": { "signal": "xMax" }
        },
        {
            "name": "y",
            "type": { "{{": ["axes.y.type", "linear"] },
            "range": "height",
            "zero": false,
            "domainMin": { "signal": "yMin" },
            "domainMax": { "signal": "yMax" }
        },
        {
            "name": "color",
            "type": "ordinal",
            "domain": {
                "[[": [
                    { "{{": "series" },
                    "d",
                    { "{{": "d.name" }
                ]
            },
            "range": {
                "[[": [
                    { "{{": "series" },
                    "d",
                    { "{{": ["d.color", "steelblue"] }
                ]
            }
        }
    ],
    "axes": [
        {
            "type": "x",
            "scale": "x",
            "grid": true,
            "layer": "back",
            "title": { "{{": ["axes.x.title", ""] }
        },
        {
            "type": "y",
            "scale": "y",
            "grid": true,
            "layer": "back",
            "title": { "{{": ["axes.y.title", ""] }
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
                    "marks": {
                        "[[": [
                            { "{{": "series" },
                            "d",
                            {
                                "??": [
                                    { "{{": ["d.line", false] },
                                    {
                                        "type": "line",
                                        "from": { "data": { "{{": "d.name" } },
                                        "properties": {
                                            "update": {
                                                "x": { "scale": "x", "field": "x" },
                                                "y": { "scale": "y", "field": "y" },
                                                "stroke": { "scale": "color", "value": { "{{" : "d.name" } },
                                                "strokeWidth": { "{{": ["d.lineWidth", 1] }
                                            }
                                        }
                                    },
                                    null
                                ]
                            }
                        ]
                    }
                },
                {
                    "type": "group",
                    "marks": {
                        "[[": [
                            { "{{": "series" },
                            "d",
                            {
                                "??": [
                                    { "{{": ["d.point", true] },
                                    {
                                        "type": "symbol",
                                        "from": { "data": { "{{": "d.name" } },
                                        "properties": {
                                            "update": {
                                                "x": { "scale": "x", "field": "x" },
                                                "y": { "scale": "y", "field": "y" },
                                                "fill": { "scale": "color", "value": { "{{" : "d.name" } },
                                                "stroke": { "value": "#444" },
                                                "shape": { "value": { "{{": ["d.shape", "circle"] } },
                                                "strokeWidth": { "value": { "{{": ["d.strokeWidth", 0.25] } },
                                                "size": { "value": { "{{": ["d.pointSize", 20] } }
                                            },
                                            "hover": {
                                                "size": { "value": 80 }
                                            }
                                        }
                                    },
                                    null
                                ]
                            }
                        ]
                    }
                },
                {
                    "type": "text",
                    "properties": {
                        "enter": {
                            "align": { "value": "center" },
                            "fill": { "value": "#333" }
                        },
                        "update": {
                            "x": { "scale": "x", "signal": "tooltip.x" },
                            "y": { "scale": "y", "signal": "tooltip.y", "offset": -5 },
                            "text": { "template": "({{tooltip.x|number:'.4g'}}, {{tooltip.y|number:'.4g'}})" },
                            "fillOpacity": {
                                "rule": [
                                    {
                                        "predicate": {
                                            "name": "tooltip",
                                            "id": { "value": null }
                                        },
                                        "value": 0
                                    },
                                    { "value": 1 }
                                ]
                            }
                        }
                    }
                }
            ]
        }
    ]
});
