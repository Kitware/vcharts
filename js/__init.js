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
    var transformed, index, templateSpec, elements, element, elementIndex, arg1, arg2;
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
                options[templateSpec[0]] = templateSpec[1];
            }
            return transformed;
        }
        if (spec['[['] !== undefined) {
            templateSpec = spec['[['];
            transformed = [];
            elements = vcharts.transform(templateSpec[0], options);
            for (elementIndex = 0; elementIndex < elements.length; elementIndex += 1) {
                options[templateSpec[1]] = elements[elementIndex];
                element = vcharts.transform(templateSpec[2], options);
                if (element !== null) {
                    transformed.push(element);
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
