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
