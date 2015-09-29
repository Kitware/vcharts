var templates = {
    bullet: require('../templates/bullet.json'),
    vega: require('../templates/vega.json'),
    xy: require('../templates/xy.json')
};

var getNested = function (spec, parts) {
    if (spec === undefined || parts.length === 0) {
        return spec;
    }
    return getNested(spec[parts[0]], parts.slice(1));
}

var setNested = function (spec, parts, value) {
    if (parts.length === 1) {
        spec[parts[0]] = value;
        return;
    }
    if (spec[parts[0]] === undefined) {
        spec[parts[0]] = {};
    }
    return setNested(spec[parts[0]], parts.slice(1));
}

var transform = function (spec, options, scope) {
    var transformed,
        index,
        templateSpec,
        elements,
        element,
        elementIndex,
        itemIndex,
        nameParts,
        arg1, arg2, key;

    options = options || {};
    scope = scope || {};

    if (Array.isArray(spec)) {
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
        if (spec['{{'] !== undefined) {
            templateSpec = spec['{{'];
            if (typeof templateSpec === 'string') {
                templateSpec = [templateSpec];
            }
            if (templateSpec.length < 2) {
                templateSpec = [templateSpec[0], null];
            }
            nameParts = templateSpec[0].split('.');
            transformed = getNested(scope, nameParts) || getNested(options, nameParts);
            if (transformed === undefined) {
                transformed = templateSpec[1];
                setNested(scope, nameParts, templateSpec[1]);
            }
            return transformed;
        }
        if (spec['[['] !== undefined) {
            templateSpec = spec['[['];
            transformed = [];
            elements = transform(templateSpec[0], options, scope);
            for (elementIndex = 0; elementIndex < elements.length; elementIndex += 1) {
                scope[templateSpec[1]] = elements[elementIndex];
                for (itemIndex = 2; itemIndex < templateSpec.length; itemIndex += 1) {
                    element = transform(templateSpec[itemIndex], options, scope);
                    if (element !== null) {
                        transformed.push(element);
                    }
                }
            }
            return transformed;
        }
        if (spec['??'] !== undefined) {
            templateSpec = spec['??'];
            condition = transform(templateSpec[0], options, scope);
            if (condition) {
                return transform(templateSpec[1], options, scope);
            }
            return transform(templateSpec[2], options, scope);
        }
        if (spec['=='] !== undefined) {
            templateSpec = spec['=='];
            arg1 = transform(templateSpec[0], options, scope);
            arg2 = transform(templateSpec[1], options, scope);
            return (arg1 === arg2);
        }
        transformed = {};
        for (key in spec) {
            if (spec.hasOwnProperty(key)) {
                transformed[key] = transform(spec[key], options, scope);
            }
        }
        return transformed;
    }
    return spec;
}

var isObjectLiteral = function (object) {
    return object && object.constructor && object.constructor.name === 'Object';
}

var isArrayLiteral = function (object) {
    return object && object.constructor && object.constructor.name === 'Array';
}

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
}

var chart = function (type, initialOptions) {
    var that = this;

    that.options = {};
    that.specTemplate = templates[type];

    that.update = function (newOptions) {
        var vegaOptions, spec, sizeOptions, curOptions, el;

        that.options = extend(that.options, newOptions);

        // Transform pass 1 to get the padding
        spec = transform(that.specTemplate, that.options);

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
        spec = transform(that.specTemplate, curOptions);
        console.log(spec);

        vg.parse.spec(spec, function (chartObj) {
            var chart = chartObj(vegaOptions);
            chart.update();
        });
    };

    that.update(initialOptions);

    return that;
}

module.exports = {
    transform: transform,
    chart: chart,
    templates: templates
};
