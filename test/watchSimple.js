var expect = require('chai').expect;
var $observe = require('../src/observer');

describe('$observe - simple cases', function() {
	it('should watch a string change', function(next) {
		var scope = {
			str: 'string',
		};

		var observer = $observe(scope, 'str').on('change', v => {
			expect(v).to.have.property('str', 'string2');
			next();
		});

		scope.str = 'string2';
		observer.check();
	});

	it('should watch an object change', function(next) {
		var scope = {
			obj: {key: 'val'},
		};

		var observer = $observe(scope, 'obj')
			.on('key', (k, v) => {
				expect(k).to.be.equal('obj.key');
				expect(v).to.be.equal('val2');
			})
			.on('change', v => expect(v).to.have.deep.property('obj.key', 'val2'))
			.on('finally', next)

		scope.obj.key = 'val2';
		observer.check();
	});

	it('should watch an array change', function(next) {
		var scope = {
			arr: [10, 23, 35],
		};

		var observer = $observe(scope, 'arr')
			.on('key', (k, v) => {
				expect(k).to.be.equal('obj.arr');
				expect(v).to.be.equal('val2');
			})
			.on('change', v => expect(v).to.be.deep.equal({arr: [10, 15, 23, 35]}))
			.on('finally', next)

		scope.arr.splice(1, 0, 15);
		observer.check();
	});
});
