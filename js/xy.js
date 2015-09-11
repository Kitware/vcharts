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
                            "text": { "template": "({{tooltip.x|number:'4g'}}, {{tooltip.y|number:'4g'}})" },
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
