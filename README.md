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

## API

### vcharts.*chartType()*

Initialize a chart with the call

```js
var chart = vcharts.chartType(options);
```

where *chartType* is one of the supported chart types.

The *options* argument is an object specifying the chart's options.
The following options are available to all charts:

| Option    | Type   | Description  |
| :-------- | :----- | :----------- |
| el        | DOM element or selector string | The container for the visualization. |
| renderer  | String | Whether to render in "svg" or "canvas" mode (default "canvas"). |
| width     | Number | Width of the chart in pixels. |
| height    | Number | Height of the chart in pixels. |

If *width* and/or *height* are not specified, they are computed based on
the width and height of the enclosing element *el*.

### chart.update()

Note that the *width* and *height* options are not
dynamically bound if left unset,
so if the width or height of *el* changes, or has just
been set programmatically, you may need to call `update` either in a
`setTimeout` or `window.resize` callback. The following
will set the *width* and *height* correctly after a DOM update:

```js
var div = $('#mydiv').css('width', '100px').css('height', '400px');

// Width and height will not be picked up yet since the DOM is not updated.
var chart = vcharts.chartType({ el: div.get(0), /* more options */ });

// Refresh width and height here.
setTimeout(function () { chart.update(); }, 1);
```

The following will resize the chart when the window resizes:

```js
var chart = vcharts.chartType({ el: '#mydiv', /* more options */ });

// Update size on window resize.
window.onresize = function () {
    chart.update();
};
```

### vcharts.vega()

Generic Vega renderer. The following additional option is supported:

| Option    | Type   | Description  |
| :-------- | :----- | :----------- |
| spec      | Object | The Vega spec to render. |

### vcharts.xy()

Plots (x,y) coordinate pairs as points and/or lines. The following
additional options are supported:

| Option    | Type   | Description  |
| :-------- | :----- | :----------- |
| series    | Array of [Series](#series) | The data series to render. |
| axes      | Object | An object describing the *x* and *y* axes of the form {x: [Axis](#axis), y: [Axis](#axis)}

### Series

A series describes the data and visual mappings for a list of x,y coordinates.
Series objects have the following options:

| Option    | Type   | Description  |
| :-------- | :----- | :----------- |
| name      | String | The name of the series to show in legend. |
| values    | Array  | The array of items in the series. |
| x         | String | Accessor for *x* values as a string, where current item is referred to by *datum* (e.g. `'datum.x'`, `'datum[0]'`). |
| y         | String | Accessor for *y* values as a string, where current item is referred to by *datum* (e.g. `'datum.y'`, `'datum[1]'`). |
| color     | String | Color as any CSS-compatible color string representation (e.g. `'blue'`, `'#ffffff'`). |
| line      | Boolean | Connect the series with a line (default *true*). |
| point     | Boolean | Render points (default *false*). |
| pointSize | Number | The size of points in square pixels. |
| lineWidth | Number | The width of the line in pixels. |

### Axis

An axis describes how to scale and display an axis. Axis objects have the
following options:

| Option    | Type   | Description  |
| :-------- | :----- | :----------- |
| title     | String | The axis title. |
| type      | String | The mode for axis scale, either `'linear'` (default) or `'time'`. |
| range     | Array  | Two-element array for the axis range of the form [*min*, *max*]. |
| pan       | Boolean | Allow panning this axis with mouse drags (default *true*). |
| zoom      | Boolean | Allow zooming this axis with mouse wheel or swipe (default *true*). |

### vcharts.bullet()

Bullet graphs based on the [description by Perceptual Edge](http://www.perceptualedge.com/articles/misc/Bullet_Graph_Design_Spec.pdf).
The following additional options are supported:

| Option    | Type   | Description  |
| :-------- | :----- | :----------- |
| value     | Number | The value to display as a solid bar. |
| title     | String | Title to display to the left. |
| subtitle  | String | Subtitle to display below the title. |
| markers   | Array  | Comparative markers to display with the form {value: *Number*}, displayed as a vertical line. |
| ranges    | Array of [Range](#range) | Background ranges to display under the chart. |

#### Example

```js
vcharts.bullet({
    el: '#vis',
    value: 0.8,
    title: 'Error',
    subtitle: '% deviation from ground truth',
    markers: [{value: 0.05}],
    ranges: [
        {min: 0, max: 0.1, background: '#eeeeee'},
        {min: 0.1, max: 0.75, background: '#aaaaaa'},
        {min: 0.75, max: 1, background: '#888888'}
    ]
});
```

### Range

A range represents a visual range of an axis with background and foreground colors. Options available are:

| Option    | Type   | Description  |
| :-------- | :----- | :----------- |
| min       | Number | The minimum value of the range. |
| max       | Number | The maximum value of the range. |
| background | String | The background color of the range. |
| foreground | String | The color of values and markers that fall in this range (default: `'black'`). |
