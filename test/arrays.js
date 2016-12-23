var _ = require('lodash');
var expect = require('chai').expect;
var $observe = require('../src/obsvr');

describe('$observe - arrays', function() {
	it('should detect simple array value setting', function() {
		var scope = {
			arr: [1, 2, 3],
		};

		var calledKeys = {};
		var changes = [];

		var observer = $observe(scope, 'arr')
			.on('path', (k, v) => calledKeys[k] = true)
			.on('change', v => changes.push(_.cloneDeep(v)))

		scope.arr[0] = 12;
		observer.check();
		scope.arr[2] = 34;
		scope.arr[1] = 21;
		observer.check();
		expect(changes).to.be.deep.equal([
			[12, 2, 3],
			[12, 21, 34],
		]);
	});

	it('should detect array inserts - splice, push, shift', function() {
		var scope = {
			arr: [10, 23, 35],
		};

		var calledPaths = {};
		var changes = [];

		var observer = $observe(scope, 'arr')
			.on('path', (k, v) => calledPaths[k] = true)
			.on('change', v => changes.push(_.cloneDeep(v)))

		scope.arr.splice(2, 0, 27);
		observer.check();
		scope.arr.push(47);
		observer.check();
		expect(changes).to.be.deep.equal([
			[10, 23, 27, 35],
			[10, 23, 27, 35, 47],
		]);
		expect(calledPaths).to.be.deep.equal({'': true, 2: true, 3: true, 4: true});
	});

	it('should detect array removals - pop, shift', function() {
		var scope = {
			arr: [11, 22, 33, 44],
		};

		var calledKeys = {};
		var changes = [];

		var observer = $observe(scope, 'arr')
			.on('path', (k, v) => calledKeys[k] = true)
			.on('change', v => changes.push(_.cloneDeep(v)))

		scope.arr.pop();
		observer.check();

		scope.arr.shift();
		observer.check();

		expect(changes).to.be.deep.equal([
			[11, 22, 33],
			[22, 33],
		]);
	});

	it.skip('should detect delete operations');
});
