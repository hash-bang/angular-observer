var expect = require('chai').expect;
var $observe = require('../src/obsvr');

describe('$observe - grouping (multiple paths)', function() {
	it('should watch multiple paths of scalar objects', function() {
		var scope = {
			str: 'string',
			dat: new Date,
			num: 10,
		};

		var changedPaths = [];

		var observer = $observe(scope, ['str', 'num'])
			.on('path', (p, v) => changedPaths.push(p))

		scope.str = 'string2';
		scope.num++;
		observer.check();
		expect(changedPaths).to.deep.equal(['str', 'num']);
	});

	it('should watch multiple paths of nested objects', function() {
		var scope = {
			foo: {
				fooFoo: 48,
				fooBar: {
					fooBarBaz: 123,
				},
			},
			bar: 321,
			baz: {
				bazFoo: [17, 18, 19],
				bazBaz: true,
			},
		};

		var changes = [];
		var changedPaths = [];

		var observer = $observe.deep(scope, ['foo.fooFoo', 'bar', 'baz.bazFoo'])
			.on('change', c => changes.push(c))
			.on('path', (p, v) => changedPaths.push(p))

		scope.foo.fooFoo++;
		scope.baz.bazFoo.push(20);
		observer.check();
		expect(changes).to.deep.equal([
			{foo: {fooFoo: 49, fooBar: {fooBarBaz: 123}}, bar: 321, baz: {bazFoo: [17, 18, 19, 20], bazBaz: true}},
		]);
		expect(changedPaths).to.deep.equal(['foo.fooFoo', 'baz.bazFoo.3']);
	});
});
