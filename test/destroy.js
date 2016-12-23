var expect = require('chai').expect;
var $observe = require('../src/observer');

describe('$observe - destruction', function() {
	it('should no longer detect changes when destroyed', function(next) {
		var scope = {
			str: 'string',
		};

		var isDestroyed = false;

		var observer = $observe(scope, 'str')
			.on('change', function(v) {
				if (isDestroyed) {
					expect.fail();
				} else {
					expect(v).to.have.property('str', 'string2');
					this.destroy(); // Destory ourselves after the change
				}
			})
			.on('destroy', method => expect(method).to.equal('manual'))

		scope.str = 'string2';
		observer.check();
		// Observer will destroy itself in last check
		scope.str = 'string3';
		expect(observer.check).to.throw();
		next();
	});

	it('should self destruct when no more hooks exist', function(next) {
		var scope = {
			str: 'string',
		};

		var observer = $observe(scope, 'str')
			.once('change', v => expect(v).to.have.property('str', 'string2'))
			.on('destroy', method => {
				expect(method).to.equal('selfDestruct');
				next();
			})

		scope.str = 'string2';
		observer.check();
	});

	it('should self NOT destruct when no more hooks exist if configured (selfDestruct=false)', function(next) {
		var scope = {
			str: 'string',
		};

		var observer = $observe(scope, 'str', {selfDestruct: false})
			.once('change', v => expect(v).to.have.property('str', 'string2'))
			.on('destroy', method => expect.fail())
			.on('finally', _=> next())

		scope.str = 'string2';
		observer.check();
	});
});
