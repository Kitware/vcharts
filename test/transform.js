var assert = require('assert'),
    vcharts = require('../src/index.js');

describe('transform', function () {
    describe('base', function () {
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
    });

    describe('{{ operator', function () {
        it('should lookup values', function () {
            var spec = {'{{': 'a'};
            assert.deepEqual(12, vcharts.transform(spec, {a: 12}));
        });

        it('should default values', function () {
            var spec = {'{{': ['a', 5]};
            assert.deepEqual(5, vcharts.transform(spec, {b: 12}));
        });

        it('should reuse default values later', function () {
            var spec = [{'{{': ['a', 5]}, {'{{': 'a'}];
            assert.deepEqual([5, 5], vcharts.transform(spec, {b: 12}));
        });

        it('should not modify options', function () {
            var spec = [{'{{': ['a', 5]}, {'{{': 'a'}];
            var options = {b: 12};
            vcharts.transform(spec, options);
            assert.deepEqual({b: 12}, options);
        });

        it('should allow nested defaulting on defined parent', function () {
            var spec = [{'{{': ['a.b', 5]}, {'{{': 'a.b'}, {'{{': 'a.d'}];
            assert.deepEqual([5, 5, 1], vcharts.transform(spec, {a: {d: 1}}));
        });

        it('should allow nested defaulting on undefined parent', function () {
            var spec = [{'{{': ['a.b', 5]}, {'{{': 'a.b'}];
            assert.deepEqual([5, 5], vcharts.transform(spec));
        });
    });

    describe('[[ operator', function () {
        it('should build an array', function () {
            var spec = {'[[': [[1, 2, 3], 'd', {'{{': 'd'}]};
            assert.deepEqual([1, 2, 3], vcharts.transform(spec));
        });

        it('should not add null array items', function () {
            var spec = {'[[': [[1, null, 3], 'd', {'{{': 'd'}]};
            assert.deepEqual([1, 3], vcharts.transform(spec));
        });

        it('can contain complex objects', function () {
            var spec = {'[[': [[1, 2, 3], 'd', {a: {'{{': 'd'}}]};
            assert.deepEqual([{a: 1}, {a: 2}, {a: 3}], vcharts.transform(spec));
        });

        it('can nest', function () {
            var spec = {
                '[[': [
                    [1, 2, 3],
                    'd',
                    {
                        '[[': [
                            ['a', 'b'],
                            'dd',
                            {
                                d: {'{{': 'd'},
                                dd: {'{{': 'dd'}
                            }
                        ]
                    }
                ]
            };
            assert.deepEqual([
                [{d: 1, dd: 'a'}, {d: 1, dd: 'b'}],
                [{d: 2, dd: 'a'}, {d: 2, dd: 'b'}],
                [{d: 3, dd: 'a'}, {d: 3, dd: 'b'}]
            ], vcharts.transform(spec));
        });

        it('should not modify options', function () {
            var spec = {'[[': [[1, 2, 3], 'd', {'{{': 'd'}]};
            var options = {b: 12};
            vcharts.transform(spec, options);
            assert.deepEqual({b: 12}, options);
        });

        it('should override option with loop variable', function () {
            var spec = {'[[': [[1, 2, 3], 'd', {'{{': 'd'}]};
            var options = {d: 12};
            assert.deepEqual([1, 2, 3], vcharts.transform(spec, options));
            assert.deepEqual({d: 12}, options);
        });
    });

    describe('?? operator', function () {
        it('should choose first option when true', function () {
            var spec = {'??': [true, 10, 20]};
            assert.deepEqual(10, vcharts.transform(spec));
        });

        it('should choose second option when false', function () {
            var spec = {'??': [false, 10, 20]};
            assert.deepEqual(20, vcharts.transform(spec));
        });

        it('should work with sub-expressions', function () {
            var spec = {'??': [{'{{': 'a'}, {'{{': 'b'}, 20]};
            assert.deepEqual(5, vcharts.transform(spec, {a: true, b: 5}));
        });

        it('should treat JavaScript falsy values as false', function () {
            var spec = [
                {'??': [null, 10, 20]},
                {'??': [undefined, 10, 20]},
                {'??': [0, 10, 20]},
                {'??': [NaN, 10, 20]},
                {'??': ['', 10, 20]}
            ]
            assert.deepEqual(
                [20, 20, 20, 20, 20],
                vcharts.transform(spec)
            );
        });
    });

    describe('== operator', function () {
        it('should test for JavaScript === equality', function () {
            var spec = [
                {'==': [{}, {}]},
                {'==': [0, 0]},
                {'==': ['abc', 'abc']},
                {'==': [1, '1']},
                {'==': [null, null]}
            ]
            assert.deepEqual(
                [false, true, true, false, true],
                vcharts.transform(spec)
            );
        });

        it('can work with sub-expressions', function () {
            var spec = [
                {'==': [{'{{': 'a'}, 10]},
                {'==': [{'{{': 'b'}, {'{{': 'c'}]}
            ];
            assert.deepEqual(
                [true, true],
                vcharts.transform(spec, {a: 10, b: 5, c: 5})
            );
        });
    });

    describe('min', function () {
        it('should find minimum of array', function () {
            var spec = {
                'min()': [[{v: 10}, {v: 2}, {v: 3}, {v: 1}, {v: 8}], 'datum.v']
            }
            assert.equal(1, vcharts.transform(spec));
        });
    });

    describe('max', function () {
        it('should find maximum of array', function () {
            var spec = {
                'max()': [[{v: 10}, {v: 2}, {v: 3}, {v: 1}, {v: 8}], 'datum.v']
            }
            assert.equal(10, vcharts.transform(spec));
        });
    });

});
