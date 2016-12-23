var expect = require('chai').expect;
var $observe = require('../src/obsvr');

describe('$observe - deep watching', function() {
	it('should watch a deep object change', function(next) {
		var scope = {
			foo: {
				bar: {
					baz: 'baz',
				},
			},
		};

		var observer = $observe.deep(scope, 'foo', {root: false})
			.on('change', v => expect(v).to.have.deep.property('foo.bar.baz', 'baz2'))
			.on('path', (p, v) => {
				expect(p).to.equal('foo.bar.baz');
				expect(v).to.equal('baz2');
			})
			.on('finally', next)

		scope.foo.bar.baz = 'baz2';
		observer.check();
	});

	it('should only watch the top layer (deep=1)', function() {
		var scope = {
			foo: {
				bar: {
					baz: 'baz',
				},
				baz: 'baz',
			},
		};

		var changedPaths = [];

		var observer = $observe(scope, 'foo', {root: false})
			.on('path', (p, v) => changedPaths.push(p))

		scope.foo.baz = 'baz2';
		scope.foo.bar.baz = 'baz2';
		observer.check();
		expect(changedPaths).to.deep.equal(['foo.baz']);
	});

	it('should only watch the second to top layer (deep=2)', function() {
		var scope = {
			foo: {
				bar: {
					foo: 'fooBarFoo',
					baz: {
						quz: 'fooBarBazQuz',
					},
				},
				baz: 'baz',
				quz: 'quz',
			},
		};

		var changedPaths = [];

		var observer = $observe(scope, 'foo', {deep: 2})
			.on('change', v => {
				expect(v).to.have.deep.property('bar.foo', 'fooBarFoo2');
				expect(v).to.have.deep.property('bar.baz.quz', 'fooBarBazQuz2');
				expect(v).to.have.deep.property('quz', 'quz2');
			})
			.on('path', (p, v) => changedPaths.push(p))

		scope.foo.baz = 'baz2';
		scope.foo.quz = 'quz2';
		scope.foo.bar.foo = 'fooBarFoo2';
		scope.foo.bar.baz.quz = 'fooBarBazQuz2';
		observer.check();
		expect(changedPaths).to.deep.equal(['baz', 'quz', 'bar.foo']);
	});
});
