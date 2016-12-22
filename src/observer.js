var _ = require('lodash');

var $observe = function(scope, paths, callback, params) {
	var observe = this;
	observe.scope = scope;
	observe.paths = _.castArray(paths);
	observe.originalValues = {};
	observe.deep = 1;

	/**
	* Whether the path returned in event emitters is relitive to something else within the scope
	* If this is TRUE the root will be calculated from the path given (similar to how $scope.$watch works in angular), if false its disabled and if its a string it will be used as the relative path
	* @var {boolean|string}
	*/
	observe.root = true;

	// Argument juggling {{{
	if (!scope) {
		throw new Error('You must specify a scope to use');
	} else if (!paths) {
		throw new Error('You must specify a path or paths to watch');
	} else if (_.isObject(callback) || _.isNumber(callback)) {
		params = callback;
		callback = undefined;
	}
	// }}}
	// Import params {{{
	if (_.isNumber(params)) params.deep = params;
	if (_.isObject(params)) {
		if (_.has(params, 'deep')) {
			if (!_.isNumber(params.deep) && params.deep !== true) throw new Error('Deep config option either should be a maximum depth number or boolean true');
			observe.deep = params.deep;
		}
		if (_.has(params, 'root')) observe.root = params.root;
	}
	// }}}
	// Calculate params.root if its in auto mode {{{
	if (observe.root === true && observe.paths.length == 1) { // Auto compute the root if root==true and we only have one path anyway
		observe.root = observe.paths[0];
	}
	// }}}


	/**
	* Get the current value of the watch item
	* @param {string|array} path Additional path to append onto the scope
	* @return {mixed} The current watch item
	*/
	observe.get = function(path) {
		if (!path) return observe.scope;
		return _.get(observe.scope, _.isArray(path) ? path.join('.') : path);
	};


	/**
	* Walk every item in the tree running a callback on each
	* @param {function} cb The callback to run. This is excuted with (value, key, path) where path is an array of all path segments of that item
	* @param {array} [path] The specific path to examine relative to the scope
	* @param {mixed} [item] A specific item to start at
	* @param {number} [depth] The current depth of traversal (used to stop traversing when we're above observe.depth)
	*/
	observe.traverse = function(cb, path, item, depth) {
		if (!path && _.isUndefined(item)) { // If we we're passed undefined assume the user wanted to traverse all specified paths
			observe.paths.forEach(path => observe.traverse(cb, path.split('.'), observe.get(path), 1));
		} else if (_.isArray(item)) {
			if (_.isNumber(observe.deep) && depth > observe.deep) return; // Refuse to go any deeper
			item.forEach((v, k) => observe.traverse(cb, (path||[]).concat([k]), v, depth ? depth + 1 : 1));
		} else if (_.isObject(item)) {
			if (_.isNumber(observe.deep) && depth > observe.deep) return; // Refuse to go any deeper
			_.keys(item).forEach((k) => observe.traverse(cb, (path||[]).concat([k]), item[k], depth ? depth + 1 : 1));
		} else {
			cb(item, path ? path[path.length-1] : '', path||[]);
		}
	};


	/**
	* Inject methods into the object to track for changes
	* @return {Object} This chainable object
	*/
	observe.inject = function() {
		observe.originalValues = {};
		observe.traverse(function(v, k, path) {
			// If its an object (or array) glue the `$clean` property to it to detect writes
			if (_.isObject(v)) {
				Object.defineProperty(v, '$clean', {
					enumerable: false,
					value: true,
				});
			} else if (!_.isPlainObject(v)) { // For everything else - stash the original value in this.parent.$originalValues
				observe.originalValues[path.join('.')] = v;
			}
		});
		return observe;
	};


	/**
	* Check if a path or the entire object is modified
	* @param {string|array} [path] An optional path to examine. If no path is given the entire object is examined and an array of all modified paths is returned
	* @return {array|boolean} If no path was given an array is returned with all modified paths, if a specific path is given a boolean is returned if that path was modified
	*/
	observe.isModified = function(path) {
		if (path) {
			var v = observe.get(path);
			if (_.isObject(v)) { // If its an object (or an array) examine the $clean propertly
				return !v.$clean;
			} else { // If its everything else look at the original value we have on file
				return observe.originalValues[_.isArray(path) ? path.join('.') : path] != v;
			}
		} else {
			var modified = [];
			observe.traverse(function(v, key, path) {
				if (observe.isModified(path)) modified.push(path.join('.'));
			});
			return modified;
		}
	};


	/**
	* Check the status of an object and fire all events if any change is found
	* @emits change Fired if any part of the target was changed. Params (value)
	* @emits key Fired if a top level key changes. Params (key, value)
	* @emits path Fired if any item changes. Params (path, value)
	* @emits postChange Fired after all other hooks have fired (and there was at least one change)
	* @emits postInject Fired after the injection stage. Params (value)
	* @emits finally Fired when everything has finished. Params ()
	* @return {Object} This chainable object
	*/
	observe.check = function() {
		var modified = observe.isModified();
		if (modified.length) observe.emit('change', observe.get());

		modified.forEach(path => {
			var reportPath = observe.root && path.startsWith(observe.root) ? path.substr(observe.root.length + 1) : path; // Calculate the relatve path?
			if (reportPath.indexOf('.') < 0) observe.emit('key', reportPath, observe.get(path));

			observe.emit('path', reportPath, observe.get(path));
		});

		if (modified.length) observe.emit('postChange', observe.get());

		observe.inject();
		if (modified.length) observe.emit('postInject', observe.get());

		observe.emit('finally');

		return observe;
	};


	// $observerProvider integration
	// INCLUDEIF $observeProvider: observe.checkAll = $observeProvider.checkAll; //
	// INCLUDEIF $observeProvider: $observeProvider.register(observe); //

	// Events / Hooks {{{
	observe.hooks = {}; // Each key is a hook, each value an array of hook registers. Each register is of type {[id], cb, [once=false]}

	/**
	* Fire a given hook
	* @param {string} hook The hook name
	* @param {mixed...} param Additional parameters to pass to the hook callback
	*/
	observe.emit = function(hook) {
		if (!observe.hooks[hook]) return; // No hook registered
		if (!observe.hooks[hook].length) return; // No-one is interested

		var args = Array.prototype.slice.call(arguments, 0);
		var hook = args.shift();
		var removeOnce = false;

		observe.hooks[hook].forEach(hook => {
			hook.cb.apply(observe, args);
			if (hook.once) removeOnce = true; // Mark that we need to filter by once hooks afterwards
		});

		// Remove all once==true hooks if we saw any
		if (removeOnce) observe.hooks[hook] = observe.hooks[hook].filter(hook => !hook.once);

		return observe;
	};


	/**
	* Register a hook
	* @param {string} hook The hook to listen for
	* @param {function} cb The callback when the hook fires
	* @param {Object} [params] Additional hook parameters such as an id
	* @return {Object} This chainable object
	*/
	observe.on = function(hook, cb, params) {
		// Never seen this type of hook before
		if (!observe.hooks[hook]) observe.hooks[hook] = [];

		// Push our hook onto the stack
		observe.hooks[hook].push(Object.assign({}, {
			cb: cb,
			once: false,
		}, params || {}))

		return observe;
	};


	/**
	* Register a hook to fire only once
	* This is really just a conveience function to map on()
	* @param {string} hook The hook to listen for
	* @param {function} cb The callback when the hook fires
	* @param {Object} [params] Additional hook parameters such as an id
	* @return {Object} This chainable object
	* @see on()
	*/
	observe.once = function(hook, cb, params) {
		return observe.on(hook, cb, Object.assign({}, {once: true}, params || {}));
	};


	/**
	* Alias of observe.once
	* @alias once()
	*/
	observe.one = observe.once;


	/**
	* Deregister a hook
	* You can either pass a function (the callback to search for) or a string (the ID to search for)
	* @param {string} hook The hook to deregister
	* @param {function|string} cb Either the callback or the ID of the hook to deregister
	* @return {Object} This chainable object
	*/
	observe.off = function(hook, cb) {
		if (!observe.hooks[hook]) return; // None of this type registered anyway
		observe.hooks[hook] = observe.filter(h => {
			if (_.isFunction(cb)) {
				return h.cb == cb;
			} else {
				return h.id == cb;
			}
		});
		return observe;
	};
	// }}}

	if (_.isFunction(callback)) observe.on('change', callback); // Passed a callback during invoke - attach to 'change' hook

	observe.inject();
	setTimeout(_=> observe.emit('init')); // Fire init on the next cycle so everything has the chance to register
	return observe;
};


/**
* Alias to quickly setup a deep watcher
* @example
* $observe.deep(SCOPE, PATH, 2) // Only scan 2 levels deep
* $observe.deep(SCOPE, PATH) // Only scan 1 levels deep
* @see $observe
*/
$observe.deep = function(scope, path, callback, params) {
	// Argument mangling {{{
	if (_.isObject(callback) || _.isNumber(callback)) {
		params = callback;
		callback = undefined;
	}
	// }}}
	if (!_.isObject(params)) params = {};
	params.deep = _.isNumber(params) ? params : true;

	return $observe(scope, path, callback, params);
};

module.exports = $observe;
