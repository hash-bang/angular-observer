var expect = require('chai').expect;
var $observe = require('../src/obsvr');

describe('$observe - simple cases', function() {
	it('should watch a string change', function(next) {
		var scope = {
			str: 'string',
		};

		var observer = $observe(scope, 'str')
			.on('path', (p, v) => expect(p).to.be.equal(''))
			.on('change', v => expect(v).to.have.property('str', 'string2'))
			.on('finally', _=> next())

		scope.str = 'string2';
		observer.check();
	});

	it('should watch an object change', function(next) {
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
			.on('finally', _=> {
				expect(calledKeys).to.be.deep.equal({key: true});
				next();
			})

		scope.obj.key = 'val2';
		observer.check();
	});

	it('should watch an array change', function(next) {
		var scope = {
			arr: [10, 23, 35],
		};

		var calledKeys = {};

		var observer = $observe(scope, 'arr')
			.on('key', (k, v) => calledKeys[k] = true)
			// .on('path', (p, v) => expect(p).to.be.equal('1'))
			.on('change', v => expect(v).to.be.deep.equal({arr: [10, 23, 27, 35]}))
			.on('finally', _=> {
				expect(calledKeys).to.be.deep.equal({2: true, 3: true});
				next();
			})

		scope.arr.splice(2, 0, 27);
		observer.check();
	});
});
