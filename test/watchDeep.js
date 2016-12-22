var expect = require('chai').expect;
var $observe = require('../src/observer');

describe('$observe - deep watching', function() {
	it('should watch a deep object change', function(next) {
		var scope = {
			foo: {
				bar: {
					baz: 'baz',
				},
			},
		};

		var observer = $observe.deep(scope, 'foo')
			.on('change', v => expect(v).to.have.deep.property('foo.bar.baz', 'baz2'))
			.on('path', (p, v) => {
				expect(p).to.equal('foo.bar.baz');
				expect(v).to.equal('baz2');
			})
			.on('finally', next)

		scope.foo.bar.baz = 'baz2';
		observer.check();
	});

	it('should only watch the top layer (deep=1)', function(next) {
		var scope = {
			foo: {
				bar: {
					baz: 'baz',
				},
				baz: 'baz',
			},
		};

		var changedPaths = [];

		var observer = $observe(scope, 'foo')
			.on('path', (p, v) => changedPaths.push(p))
			.on('finally', _=> {
				expect(changedPaths).to.deep.equal(['foo.baz']);
				next();
			});

		scope.foo.baz = 'baz2';
		scope.foo.bar.baz = 'baz2';
		observer.check();
	});

	it('should only watch the second to top layer (deep=2)', function(next) {
		var scope = {
			foo: {
				bar: {
					baz: 'baz',
				},
				baz: 'baz',
			},
		};

		var changedPaths = [];

		var observer = $observe(scope, 'foo')
			.on('change', v => {
				expect(v).to.have.deep.property('foo.bar.baz', 'baz2');
				expect(v).to.have.deep.property('foo.quz', 'quz');
			})
			.on('path', (p, v) => changedPaths.push(p))
			.on('finally', _=> {
				expect(changedPaths).to.deep.equal(['foo.baz', 'foo.quz']);
				next();
			});

		scope.foo.baz = 'baz2';
		scope.foo.quz = 'quz';
		scope.foo.bar.baz = 'baz2';
		observer.check();
	});
});
