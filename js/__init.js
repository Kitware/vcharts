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

vcharts.isObjectLiteral = function (object) {
    return object && object.constructor && object.constructor.name === 'Object';
}

vcharts.isArrayLiteral = function (object) {
    return object && object.constructor && object.constructor.name === 'Array';
}

vcharts.extend = function (defaults, options) {
    var extended,
        prop,
        index;
    if (options === undefined) {
        return defaults;
    }
    if (vcharts.isObjectLiteral(defaults)) {
        extended = {};
        for (prop in defaults) {
            if (Object.prototype.hasOwnProperty.call(defaults, prop)) {
                extended[prop] = vcharts.extend(defaults[prop], options[prop]);
            }
        }
        for (prop in options) {
            if (!Object.prototype.hasOwnProperty.call(defaults, prop)) {
                extended[prop] = options[prop];
            }
        }
        return extended;
    }
    if (vcharts.isArrayLiteral(defaults)) {
        extended = [];
        for (index = 0; index < defaults.length; index += 1) {
            extended.push(vcharts.extend(defaults[index], options[index]));
        }
        if (vcharts.isArrayLiteral(options)) {
            for (index = defaults.length; index < options.length; index += 1) {
                extended.push(options[index]);
            }
        }
        return extended;
    }
    return options;
};

vcharts.deepClone = function (obj) {
    var el = obj.el, copy;
    delete obj.el;
    copy = JSON.parse(JSON.stringify(obj));
    obj.el = el;
    copy.el = el;
    return copy;
}

vcharts.vegaModule = function (specTemplate) {
    return function (initialOptions) {
        var that = this;

        that.options = {};

        that.update = function (newOptions) {
            var vegaOptions, spec, sizeOptions, curOptions, el;

            that.options = vcharts.extend(that.options, newOptions);

            // Transform pass 1 to get the padding
            spec = vcharts.transform(specTemplate, vcharts.deepClone(that.options));

            // Use padding and element size to set size
            el = d3.select(that.options.el)[0][0];
            sizeOptions = {};
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
            curOptions = vcharts.extend(that.options, sizeOptions);

            // Options that go directly to Vega runtime
            vegaOptions = {
                el: curOptions.el,
                renderer: curOptions.renderer
            };

            // Transform pass 2 to get the final visualization
            spec = vcharts.transform(specTemplate, curOptions);
            console.log(spec);

            vg.parse.spec(spec, function (chartObj) {
                var chart = chartObj(vegaOptions);
                chart.update();
            });
        };

        that.update(initialOptions);

        return that;
    };
};
