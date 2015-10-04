var libs = require('./libs');

var templates = {
    bar: require('../templates/bar.json'),
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
}

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
}

var templateFunctions = {
    defaults: function (args, options, scope) {
        var index, value;
        for (index = 0; index < args[0].length; index += 1) {
            value = getNested(scope, args[0][index][0]) || getNested(options, args[0][index][0]);
            if (value === undefined) {
                value = transform(args[0][index][1], options, scope);
                setNested(scope, args[0][index][0], value);
            }
        }
        return transform(args[1], options, scope);
    },

    get: function (args, options, scope) {
        var value;
        value = getNested(scope, args[0]) || getNested(options, args[0]);
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
            // Remove "datum"
            field = transform(args[1], options, scope).substring(6);
        return d3.min(array, function (d) {
            return getNested(d, field);
        });
    },

    max: function (args, options, scope) {
        var array = transform(args[0], options, scope),
            // Remove "datum"
            field = transform(args[1], options, scope).substring(6);
        return d3.max(array, function (d) {
            return getNested(d, field);
        });
    }
}

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
