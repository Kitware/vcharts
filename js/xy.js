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
            "init": { "{{": ["axes.x.range.0", null] },
            "streams": [
                {
                    "type": "delta",
                    "expr": {
                        "??": [
                            { "{{": ["axes.x.pan", true] },
                            {
                                "??": [
                                    { "==": [{ "{{": "axes.x.type" }, "time"] },
                                    "time(xMinAnchor) + (time(xMaxAnchor)-time(xMinAnchor))*delta.x/width",
                                    "xMinAnchor + (xMaxAnchor-xMinAnchor)*delta.x/width"
                                ]
                            },
                            "xMinAnchor"
                        ]
                    }
                },
                {
                    "type": "zoom",
                    "expr": {
                        "??": [
                            { "{{": ["axes.x.zoom", true] },
                            {
                                "??": [
                                    { "==": [{ "{{": "axes.x.type" }, "time"] },
                                    "(time(xMinAnchor)-time(xAnchor))*zoom + time(xAnchor)",
                                    "(xMinAnchor-xAnchor)*zoom + xAnchor"
                                ]
                            },
                            "xMinAnchor"
                        ]
                    }
                }
            ]
        },
        {
            "name": "xMax",
            "init": { "{{": ["axes.x.range.1", null] },
            "streams": [
                {
                    "type": "delta",
                    "expr": {
                        "??": [
                            { "{{": ["axes.x.pan", true] },
                            {
                                "??": [
                                    { "==": [{ "{{": "axes.x.type" }, "time"] },
                                    "time(xMaxAnchor) + (time(xMaxAnchor)-time(xMinAnchor))*delta.x/width",
                                    "xMaxAnchor + (xMaxAnchor-xMinAnchor)*delta.x/width"
                                ]
                            },
                            "xMaxAnchor"
                        ]
                    }
                },
                {
                    "type": "zoom",
                    "expr": {
                        "??": [
                            { "{{": ["axes.x.zoom", true] },
                            {
                                "??": [
                                    { "==": [{ "{{": "axes.x.type" }, "time"] },
                                    "(time(xMaxAnchor)-time(xAnchor))*zoom + time(xAnchor)",
                                    "(xMaxAnchor-xAnchor)*zoom + xAnchor"
                                ]
                            },
                            "xMaxAnchor"
                        ]
                    }
                }
            ]
        },
        {
            "name": "yMin",
            "init": { "{{": ["axes.y.range.0", null] },
            "streams": [
                {
                    "type": "delta",
                    "expr": {
                        "??": [
                            { "{{": ["axes.y.pan", true] },
                            "yMinAnchor + (yMaxAnchor-yMinAnchor)*delta.y/height",
                            "yMinAnchor"
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
                                    "(yMinAnchor-time(yAnchor))*zoom + time(yAnchor)",
                                    "(yMinAnchor-yAnchor)*zoom + yAnchor"
                                ]
                            },
                            "yMinAnchor"
                        ]
                    }
                }
            ]
        },
        {
            "name": "yMax",
            "init": { "{{": ["axes.y.range.1", null] },
            "streams": [
                {
                    "type": "delta",
                    "expr": {
                        "??": [
                            { "{{": ["axes.y.pan", true] },
                            "yMaxAnchor + (yMaxAnchor-yMinAnchor)*delta.y/height",
                            "yMaxAnchor"
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
                                    "(yMaxAnchor-time(yAnchor))*zoom + time(yAnchor)",
                                    "(yMaxAnchor-yAnchor)*zoom + yAnchor"
                                ]
                            },
                            "yMaxAnchor"
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
            "domain": {
                "??": [
                    { "{{": "series.0" },
                    {
                        "data": { "{{": "series.0.name" },
                        "field": "x"
                    },
                    [0, 1]
                ]
            },
            "domainMin": { "signal": "xMin" },
            "domainMax": { "signal": "xMax" }
        },
        {
            "name": "y",
            "type": { "{{": ["axes.y.type", "linear"] },
            "range": "height",
            "zero": false,
            "domain": {
                "??": [
                    { "{{": "series.0" },
                    {
                        "data": { "{{": "series.0.name" },
                        "field": "y"
                    },
                    [0, 1]
                ]
            },
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
