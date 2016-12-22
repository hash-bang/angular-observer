var expect = require('chai').expect;
var $observe = require('../src/observer');

describe('$observe - simple cases', function() {
	it('should watch multiple paths of scalar objects', function(next) {
		var scope = {
			str: 'string',
			dat: new Date,
			num: 10,
		};

		var changedPaths = [];

		var observer = $observe(scope, ['str', 'num'])
			.on('path', (p, v) => changedPaths.push(p))
			.on('finally', _=> {
				expect(changedPaths).to.deep.equal(['str', 'num']);
				next();
			})

		scope.str = 'string2';
		scope.num++;
		observer.check();
	});

	it('should watch multiple paths of nested objects', function(next) {
		var scope = {
			foo: {
				fooFoo: 48,
				fooBar: {
					fooBarBaz: 123,
				},
			},
			bar: 321,
			baz: {
				bazFooX: [17, 18, 19],
				bazBaz: true,
			},
		};

		var changedPaths = [];

		var observer = $observe.deep(scope, ['foo.fooFoo', 'bar', 'baz.bazFoo'])
			.on('path', (p, v) => changedPaths.push(p))
			.on('finally', _=> {
				expect(changedPaths).to.deep.equal(['foo.fooFoo']);
				next();
			})

		scope.foo.fooFoo++;
		// scope.baz.bazFoo.push(20);
		observer.check();
	});
});
