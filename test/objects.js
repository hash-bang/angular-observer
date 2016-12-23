var _ = require('lodash');
var expect = require('chai').expect;
var $observe = require('../src/obsvr');

describe('$observe - objects', function() {
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
			.on('change', v => expect(v).to.deep.equal({key: 'val2'}))

		scope.obj.key = 'val2';
		observer.check();
		expect(calledKeys).to.be.deep.equal({key: true});
	});
});
