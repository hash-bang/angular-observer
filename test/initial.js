var expect = require('chai').expect;
var $observe = require('../src/obsvr');

describe('$observe - initial ignore', function() {
	it('should ignore the initial undefined state (one item, ignoreInitial=any)', function() {
		var scope = {
			str: undefined,
		};

		var firedInitial = 0;
		var firedPath = 0;

		var observer = $observe(scope, 'str')
			.on('path', (p, v) => {
				expect(p).to.be.falsy;
				expect(v).to.equal('string2')
				firedPath++;
			})
			.on('initial', _=> firedInitial++)

		observer.check();
		scope.str = 'string2';
		observer.check();
		expect(firedInitial).to.equal(1);
		expect(firedPath).to.be.equal(1);
	});

	it('should ignore the initial undefined state of ANY items in a group (multi items, ignoreInitial=any)', function() {
		var scope = {
			str: undefined,
			num: undefined,
			bol: undefined,
		};

		var firedInitial = 0;
		var firedChanges = 0;

		var observer = $observe(scope, ['str', 'num', 'bol'])
			.on('change', v => {
				firedChanges++;
				expect(v).to.deep.equal({str: 'string3', num: 2, bol: true})
			})
			.on('initial', _=> firedInitial++)

		observer.check();
		scope.str = 'string2';
		observer.check();
		scope.str = 'string3';
		observer.check();
		scope.num = 2;
		observer.check();
		scope.bol = true;
		observer.check();

		expect(firedChanges).to.be.equal(1);
		expect(firedInitial).to.be.equal(4);
	});

	it('should ignore the initial undefined state of ALL items in a group (multi items, ignoreInitial=all)', function() {
		var scope = {
			str: undefined,
			num: undefined,
			bol: undefined,
		};

		var firedInitial = 0;
		var firedChanges = 0;

		var observer = $observe(scope, ['str', 'num', 'bol'], {ignoreInitial: 'all'})
			.on('change', v => {
				firedChanges++;
				expect(v).to.deep.equal({str: 'string2', num: 3, bol: undefined})
			})
			.on('initial', _=> firedInitial++)

		observer.check();
		scope.str = 'string2';
		scope.num = 3;
		observer.check();

		expect(firedChanges).to.be.equal(1);
		expect(firedInitial).to.be.equal(1);
	});
});
