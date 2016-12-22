var expect = require('chai').expect;
var mlog = require('mocha-logger');
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

		var observer = $observe(scope, 'foo')
			.on('change', v => expect(v).to.have.deep.property('foo.bar.baz', 'baz2'))
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
			},
			bar: 'bar',
			baz: 'baz',
		};

		var observer = $observe(scope, 'foo')
			.on('change', v => expect(v).to.have.deep.property('foo.bar.baz', 'baz2'))
			.on('path', (v, p) => expect(p).to.not.equal('foo.bar.baz'))
			.one('finally', next)

		scope.baz = 'baz2';
		scope.foo.bar.baz = 'baz2';
		observer.check();
	});

	it('should only watch the second to top layer (deep=2)', function(next) {
		var scope = {
			foo: {
				bar: {
					baz: 'baz',
				},
			},
			bar: 'bar',
			baz: 'baz',
		};

		var observer = $observe(scope, 'foo')
			.on('change', v => {
				expect(v).to.have.deep.property('foo.bar.baz', 'baz2');
				expect(v).to.have.deep.property('foo.quz', 'quz');
			})
			.on('path', (v, p) => {
				mlog.log('saw change in', p);
				expect(p).to.not.equal('foo.bar.baz');
			})
			.one('finally', next)

		scope.baz = 'baz2';
		scope.foo.quz = 'quz';
		scope.foo.bar.baz = 'baz2';
		observer.check();
	});
});
