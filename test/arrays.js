var _ = require('lodash');
var expect = require('chai').expect;
var $observe = require('../src/obsvr');

describe('$observe - arrays', function() {
	it('should watch an array change', function() {
		var scope = {
			arr: [10, 23, 35],
		};

		var calledKeys = {};
		var changes = [];

		var observer = $observe(scope, 'arr')
			.on('key', (k, v) => calledKeys[k] = true)
			.on('change', v => changes.push(_.cloneDeep(v)))

		scope.arr.splice(2, 0, 27);
		observer.check();
		scope.arr.push(47);
		observer.check();
		expect(changes).to.be.deep.equal([
			{arr: [10, 23, 27, 35]},
			{arr: [10, 23, 27, 35, 47]},
		]);
		expect(calledKeys).to.be.deep.equal({'': true, 2: true, 4: true});
	});
});
