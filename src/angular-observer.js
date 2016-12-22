angular.module('angular-observer', [])
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
	this.register = observer => this.observers.push(observer);

	/**
	* Fire all registered observer check() functions
	*/
	this.checkAll = _=> this.observers.forEach(observer => observer.check());

	this.$get = function() {
		return this;
	};
})
.factory('$observe', function($observeProvider, $timeout) {
	// INCLUDE src/observer.js //

	$observe.checkAll = $observeProvider.checkAll;

	return $observe;
});
