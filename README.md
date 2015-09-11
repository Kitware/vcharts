# vcharts
Reusable [Vega](http://vega.github.io/vega/) charts.

## Getting Started

Install vcharts:

```
bower install vcharts
```

Setup a scaffold `index.html` with the following contents:

```html
<html>
<head>
    <script src="bower_components/d3/d3.min.js"></script>
    <script src="bower_components/vega/vega.min.js"></script>
    <script src="bower_componenets/vcharts/vcharts.min.js"></script>
</head>
<body>
    <div id="vis"></div>
</body>
<script>
// Your script here
</script>
```

Plot your chart in the `script` section:

```js
var s1 = [], s2 = [], i;
for (i = 0; i < 100; i += 1) {
    s1.push([{ x: Math.random(), y: Math.random() }]);
    s2.push([{ x: Math.random() + 0.5, y: Math.random() + 0.5 }]);
}
vcharts.xy({
    el: '#vis',
    series: [
        {
            name: 'series1',
            values: s1,
            color: 'steelblue',
            line: false,
            point: true
        },
        {
            name: 'series2',
            values: s2,
            color: 'orange',
            line: false,
            point: true
        }
    ],
    axes: {
        x: {
            range: [0, 1.5]
        },
        y: {
            range: [0, 1.5]
        }
    }
});
```

Start your favorite local web server:

```
python -m SimpleHTTPServer 8080 .
```

Visit [http://localhost:8080/index.html](http://localhost:8080/index.html).

## Chart Parameters

### Common Parameters

```
vcharts.chart-type({
    el: The target DOM element or selector string (e.g. "#id")
    renderer: Whether to render in "svg" or "canvas" mode (default "canvas")
    width: Width of the chart in pixels
    height: Height of the chart in pixels
});
```

### Vega

Generic Vega renderer.

```
vcharts.vega({
    ...
    spec: Full Vega specification
})
```

### XY Plot

```
vcharts.xy({
    ...
    series: [
        {
            name: Name of the series to show in legend
            values: Array of items in the series
            x: Accessor for x values as a string, where current item is datum (e.g. 'datum.x', 'datum[0]')
            y: Accessor for y values as a string, where current item is datum (e.g. 'datum.y', 'datum[1]')
            color: Color as any CSS-compatible color string representation (e.g. 'blue', '#ffffff')
            line: Connect the series with a line (default true)
            point: Render points (default false)
            pointSize: Size of points in square pixels
            lineWidth: Width of the line in pixels
        },
        ...
    ],
    axes: {
        x: {
            title: Axis title (string)
            type: Mode for axis scale, either "linear" (default) or "time"
            range: Two-element array of the form [min, max]
        },
        y: {
            ...
        }
    }
})
```

