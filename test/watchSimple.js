var _ = require('lodash');
var expect = require('chai').expect;
var $observe = require('../src/obsvr');

describe('$observe - simple cases', function() {
	it('should watch a string change', function() {
		var scope = {
			str: 'string',
		};

		var observer = $observe(scope, 'str')
			.on('path', (p, v) => expect(p).to.be.equal(''))
			.on('change', v => expect(v).to.have.property('str', 'string2'))

		scope.str = 'string2';
		observer.check();
	});

	it('should watch an object change', function() {
		var scope = {
			obj: {key: 'val'},
		};

		var calledKeys = {};

		var observer = $observe(scope, 'obj')
			.on('key', (k, v) => {
				calledKeys[k] = true;
				expect(k).to.be.equal('key');
				expect(v).to.be.equal('val2');
			})
			.on('path', (p, v) => expect(p).to.be.equal('key'))
			.on('change', v => expect(v).to.have.deep.property('obj.key', 'val2'))

		scope.obj.key = 'val2';
		observer.check();
		expect(calledKeys).to.be.deep.equal({key: true});
	});

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
