angular.module('angular-obsvr', [])
.provider('$observeProvider', function() {
	/**
	* The observers to update on a call to $observerProvider.checkAll
	* @var {array}
	*/
	this.observers = [];

	/**
	* Add an observer to the stack so it gets updated with a call to $observeProvider.checkAll
	* @param {Object} observer An $observe instance
	*/
	this.register = function(observer) {
		this.observers.push(observer);
	};

	/**
	* Remove an observer from the stack so its no longer updated
	* @param {Object} observer An $observe instance
	*/
	this.deregister = function(observer) {
		var oIndex = this.observers.findIndex(o => o == observer);
		if (oIndex > -1) this.observers.splice(oIndex, 1);
	};

	/**
	* Fire all registered observer check() functions
	*/
	this.checkAll = _=> this.observers.forEach(observer => observer.check());

	this.$get = function() {
		return this;
	};
})
.factory('$observe', function($observeProvider, $timeout) {
	// INCLUDE src/obsvr.js //

	$observe.checkAll = $observeProvider.checkAll;

	return $observe;
});
