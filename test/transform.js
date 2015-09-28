var assert = require('assert'),
    vcharts = require('../src/index.js');

describe('transform', function () {
    it('should pass through basic structures', function () {
        assert.deepEqual({}, vcharts.transform({}));
        assert.deepEqual([], vcharts.transform([]));
        assert.deepEqual('hi', vcharts.transform('hi'));
        assert.deepEqual(1.2, vcharts.transform(1.2));
        assert.deepEqual(true, vcharts.transform(true));
        assert.deepEqual(null, vcharts.transform(null));
    });

    it('should pass through deeper objects', function () {
        var deeper = {
            a: [1, 2, 'abc'],
            b: {c: false},
            c: null
        };
        assert.deepEqual(deeper, vcharts.transform(deeper));
    });

    it('should lookup values with {{', function () {
        var spec = {'{{': 'a'};
        assert.deepEqual(12, vcharts.transform(spec, {a: 12}));
    });

    it('should default values with {{', function () {
        var spec = {'{{': ['a', 5]};
        assert.deepEqual(5, vcharts.transform(spec, {b: 12}));
    });

    it('should reuse default values later', function () {
        var spec = [{'{{': ['a', 5]}, {'{{': 'a'}];
        assert.deepEqual([5, 5], vcharts.transform(spec, {b: 12}));
    });
});
