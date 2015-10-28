var assert = require('assert'),
    vcharts = require('../src/index.js');

describe('axis', function () {
    it('should set width and height based on el properties', function () {
        a = vcharts.transform(vcharts.templates.axis, {
            axis: 'y',
            domain: [0, 10],
            size: 500
        });
        console.log(JSON.stringify(a, null, 2));
        assert.deepEqual({}, a);
    });
});
