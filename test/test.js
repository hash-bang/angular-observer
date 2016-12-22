var expect = require('chai').expect;
var $observe = require('../src/observer');

describe('$observe - simple cases', function() {
	it('should watch an object change', function(next) {
		this.obj = {key: 'val'};

		var observer = $observe(this, 'obj')
			.on('key', (k, v) => {
				expect(k).to.be.equal('key');
				expect(v).to.be.equal('val2');
			})
			.on('change', v => expect(v).to.have.property('key', 'val2'))
			.on('finally', next)

		this.obj.key = 'val2';
		observer.check();
	});
});
