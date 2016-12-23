var _ = require('lodash');
var expect = require('chai').expect;
var $observe = require('../src/obsvr');

describe('$observe - objects', function() {
	it('should detect object change via key setting', function() {
		var scope = {
			obj: {key: 'val'},
		};

		var calledKeys = {};

		var observer = $observe(scope, 'obj')
			.on('key', (k, v) => {
				expect(k).to.equal('key');
				expect(v).to.equal('val2');
			})
			.on('path', (k, v) => {
				calledKeys[k] = true;
				expect(k).to.equal('key');
				expect(v).to.equal('val2');
			})
			.on('path', (p, v) => expect(p).to.be.equal('key'))
			.on('change', v => expect(v).to.deep.equal({key: 'val2'}))

		scope.obj.key = 'val2';
		observer.check();
		expect(calledKeys).to.be.deep.equal({key: true});
	});

	it('should detect new keys', function() {
		var scope = {
			obj: {key: 'val'},
		};

		var calledKeys = {};
		var calledPaths = {};

		var observer = $observe(scope, 'obj')
			.on('key', (k, v) => calledKeys[k] = true)
			.on('path', (p, v) => calledPaths[p] = true)
			.on('change', v => expect(v).to.deep.equal({key: 'val', key2: 'val2'}))

		scope.obj.key2 = 'val2';
		observer.check();
		expect(calledKeys).to.be.deep.equal({key2: true});
		expect(calledPaths).to.be.deep.equal({key2: true});
	});
});
