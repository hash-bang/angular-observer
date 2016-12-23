var _ = require('lodash');
var expect = require('chai').expect;
var $observe = require('../src/obsvr');

describe('$observe - scalars', function() {
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
});
