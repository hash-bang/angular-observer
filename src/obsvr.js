var _ = require('lodash');

var $observe = function(scope, paths, callback, params) {
	var observe = new Object();
	observe.scope = scope;
	observe.paths = _.castArray(paths);
	observe.originalValues = {};
	observe.deep = 1;
	observe.selfDestruct = true;
	observe.selfDestructHooks = ['change', 'key', 'path'];
	observe.isDestoyed = false;
	observe.ignoreInitial = 'any'; // ENUM: false (never ignore), 'any' (ignore if any of the paths are undefined), 'all' (ignore only if all of the paths are undefined)
	observe.isInitial = true;
	observe.method = 'setters'; // ENUM: 'dirty', 'setters',
	observe.scanKeyChange = true;
	observe.hookWarnings = true;
	observe.seperator = '.';
	observe.setEqualIsChange = false
	observe.ignoreKeys = [/^\$/];

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
	} else if (_.isFunction(callback)) {
		// Pass
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
		if (_.has(params, 'root')) {
			if (observe.root !== true && !_.isNumber(observe.root)) throw new Error('Root must be boolean true or a number');
			observe.root = params.root;
		}
		if (_.has(params, 'ignoreInitial')) {
			if (params.ignoreInitial !== false && !_.isString(params.ignoreInitial) && !_.includes(['once', 'any', 'all'])) throw new Error('ignoreInitial must be "never", "any", "all" or boolean false');
			observe.ignoreInitial = params.ignoreInitial;
		}
		// Arrays
		['ignoreKeys', 'selfDestructHooks'].forEach(k => {
			if (_.has(params, k)) {
				if (!_.isArray(params[k])) throw new Error(k + ' must be an array');
				observe[k] = params[k];
			}
		});
		// Strings
		['seperator'].forEach(k => {
			if (_.isUndefined(params[k])) return;
			if (!_.isString(params[k])) throw new Error(k + ' must be a string');
			observe[k] = params[k];
		});
		// Booleans
		['selfDestruct', 'scanKeyChange', 'hookWarnings', 'setEqualIsChange'].forEach(k => {
			if (_.isUndefined(params[k])) return;
			if (!_.isBoolean(params[k])) throw new Error(k + ' must be a boolean');
			observe[k] = params[k];
		});
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
		if (!path || !path.length) return observe.scope;
		return _.get(observe.scope, _.isArray(path) ? path.join(observe.seperator) : path);
	};


	/**
	* Walk every item in the tree running a callback on each
	* @param {function} cb The callback to run. This is executed with (value, key, path) where path is an array of all path segments of that item
	* @param {array} [path] The specific path to examine relative to the scope
	* @param {mixed} [item] A specific item to start at
	* @param {number} [depth] The current depth of traversal (used to stop traversing when we're above observe.depth)
	*/
	observe.traverse = function(cb, path, item, depth) {
		if (!path && _.isUndefined(item)) { // If we we're passed undefined assume the user wanted to traverse all specified paths
			observe.paths.forEach(path => observe.traverse(cb, path.split(observe.seperator), observe.get(path), 1));
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


	// Injection {{{
	/**
	* Inject methods into the object to track for changes
	* @return {Object} This chainable object
	*/
	observe.inject = function() {
		if (observe.method == 'dirty') {
			observe._injectDirty();
		} else if (observe.method == 'setters') {
			observe._injectSetters();
		}

		return observe;
	};


	/**
	* Inject dirty checking into the object
	* This is used if observe.method=='dirty'
	* @access private
	*/
	observe._injectDirty = function() {
		observe.originalValues = {};
		observe.traverse(function(v, k, path) {
			// If its an object (or array) glue the `$clean` property to it to detect writes
			if (_.isObject(v)) {
				Object.defineProperty(v, '$clean', {
					enumerable: false,
					value: true,
				});
			} else if (!_.isPlainObject(v)) { // For everything else - stash the original value in this.parent.$originalValues
				observe.originalValues[path.join(observe.seperator)] = v;
			}
		});
	};


	/**
	* Inject setter checking into the object
	* @param {Object} [obj] The object to inject into. This will be mutated. If omitted the parent of each path will be used
	* @param {array} [path] Path relative to the root for this injection. For internal use.
	* @param {number} [depth=0] The current depth (used to stop traversel when we go above Observer.deep)
	* @return {Object} The injected properties
	*/
	observe._injectSetters = function(obj, path, depth) {
		if (!obj) { // No object given - scope over paths to figure out their parents and inject those
			_(observe.paths)
				.map(path => path.split(observe.seperator).slice(0, -1))
				.uniq()
				.forEach(parentPath => {
					var child = observe.get(parentPath);
					observe._injectSetters(child, parentPath, 0);
				});
			return;
		} else if (_.isNumber(observe.deep) && depth > observe.deep) {
			return; // Refuse to go any deeper
		}

		var isArray = _.isArray(obj);
		if (!path) path = [];

		var inject = _(obj) // Object of defineProperties structure we are going to inject into this object
			.mapValues(function(v, k) {
				if (observe.ignoreKeys.some(ik => ik.test(k))) return;

				var nodePath = path.concat([k]);
				var nodeValue = v;
				if (_.isObject(v)) {
					observe._injectSetters(v, nodePath, (depth||0) + 1);
				} else { // Assume its a scalar
					return {
						enumerable: true,
						configurable: true,
						get: ()=> nodeValue,
						set: function(v) {
							if (!observe.setEqualIsChange && nodeValue == v) return; // Setting to existing value anyway - skip
							observe.setModified(nodePath);

							nodeValue = v;
							if (_.isObject(v)) observe._injectSetters(v, nodePath, (depth||0) + 1);
						},
					};
				}
			})
			.pickBy(v => !!v) // Remove all undefined items (because they got injected seperately) or things we dont want to deal with anyway
			.value()

		if (isArray) {
			inject.isArray = {
				enumerable: false,
				value: true,
			};

			inject.shift = {
				replacePrototype: true,
				enumerable: false,
				value: function() {
					var output = Array.prototype.shift.apply(this, arguments);
					observe._injectSetters(this, path, (depth||0) + 1);
					observe.setModified(path.concat([0]));
					return output;
				},
			};

			inject.push = {
				replacePrototype: true,
				enumerable: false,
				value: function() {
					var output = Array.prototype.push.apply(this, arguments);
					observe._injectSetters(this, path, (depth||0) + 1);
					observe.setModified(path.concat([this.length-1]));
					return output;
				},
			};

			['fill', 'pop', 'reverse', 'sort', 'splice', 'unshift'].forEach(method => {
				inject[method] = {
					replacePrototype: true,
					enumerable: false,
					value: function() {
						observe.setModified(path);
						var output = Array.prototype[method].apply(this, arguments);
						_.forEach(this, (c, i) => observe._injectSetters(this, path, (depth||0) + 1)); // Inject into all children
						return output;
					},
				};
			})
		}

		inject.toObject = {
			replacePrototype: true,
			enumerable: false,
			value: function() {
				return _.mapValues(this, v => {
					if (_.isObject(v) && _.hasIn(v, 'isArray') && v.isArray) {
						return _.map(v.toObject(), (v, k) => v);
					} else if (_.isObject(v) && _.hasIn(v, 'toObject')) {
						return v.toObject();
					} else {
						return v;
					}
				});
			},
		};

		inject.toString = {
			replacePrototype: true,
			enumerable: false,
			value: function() {
				debugger;
				return 'Hello Angular';
			},
		};

		inject.$obsvr = {
			enumerable: false,
			value: true,
		};

		// Attempt to inject all the composed properties {{{
		inject = _.pickBy(inject, (dp, k) => (
			!dp.replacePrototype ||
			!('$obsvr' in obj)
		));

		Object.defineProperties(obj, inject);
		// }}}

		return inject;
	};
	// }}}

	/**
	* Cache of paths marked as modified
	* This is stored as an object so each path can exist within the list only once
	* @var {Object}
	*/
	observe.markedModified = {};


	/**
	* Mark a path as modified
	* @param {string|array} path The path to mark as modified relative to the scope
	* @return {Object} This chainable object
	*/
	observe.setModified = function(path) {
		observe.markedModified[_.isArray(path) ? path.join(observe.seperator) : path] = true;
		return observe;
	}


	/**
	* Clear all paths marked as modified
	* @return {Object} This chainable object
	*/
	observe.clearModified = function() {
		observe.markedModified = {};
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
				return observe.originalValues[_.isArray(path) ? path.join(observe.seperator) : path] != v;
			}
		} else if (observe.method == 'setters') { // Use only the markedModified list
			return _.map(observe.markedModified, (v, p) => p)
		} else {
			var modified = _.map(observe.markedModified, (v, p) => p)
			observe.traverse(function(v, key, path) {
				if (observe.isModified(path)) modified.push(path.join(observe.seperator));
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
		if (observe.isDestroyed) throw new Error('observer has been destroyed');

		// Work out whether to ignore the check cycle {{{
		if (observe.isInitial) {
			switch (observe.ignoreInitial) {
				case false:
				case 'never': // Don't ignore
					observe.emit('initial', observe.get());
					observe.isInitial = false;
					break;
				case 'any':
					if (observe.paths.some(p => observe.get(p) === undefined)) {
						observe.emit('initial', observe.get());
						return observe;
					} else {
						observe.isInitial = false;
					}
					break;
				case 'all':
					if (observe.paths.every(p => observe.get(p) === undefined)) {
						observe.emit('initial', observe.get());
						return observe;
					} else {
						observe.isInitial = false;
					}
					break;
			}
		}
		// }}}

		// If method==setters AND observe.scanKeyChange==true we also need to check if any keys have been added or removed {{{
		if (observe.method == 'setters' && observe.scanKeyChange) {
			var checkKeys = function(node, path) {
				var needInject = false;
				_.forEach(node, (v, k) => {
					if (!_.isObject(node[k]) && !_.isUndefined(Object.getOwnPropertyDescriptor(node, k).value)) {
						observe.setModified(path.concat([k]));
						needInject = true;
					}
				});
			};

			_(observe.paths)
				.map(path => path.split(observe.seperator).slice(0, -1))
				.uniq()
				.forEach(parentPath => {
					var parent = observe.get(parentPath);
					checkKeys(parent, parentPath);
					observe.traverse(function(v, k, path) {
						var parentPath = path.slice(0, -1);
						var parent = observe.get(parentPath);
						if (_.isObject(parent)) checkKeys(parent, parentPath);
					}, parentPath, parent, 0);
				});
		}
		// }}}

		var modified = observe.isModified();
		if (modified.length) observe.emit('change', observe.get(observe.root || undefined));

		modified.forEach(path => {
			var reportPath = observe.root && path.startsWith(observe.root) ? path.substr(observe.root.length + 1) : path; // Calculate the relatve path?
			if (reportPath.indexOf(observe.seperator) < 0) observe.emit('key', reportPath, observe.get(path));

			observe.emit('path', reportPath, observe.get(path));
		});

		observe.clearModified();

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
		if (removeOnce) {
			observe.hooks[hook] = observe.hooks[hook].filter(hook => !hook.once);
			observe.checkSelfDestruct();
		}

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
		if (observe.hookWarnings && hook == 'changes') {
			console.warn('Call to Observer.on(\'changes\') but that should be non-plural. Replacing with "change" for now but you should also change your source code');
			hook = 'change';
		}

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
		observe.checkSelfDestruct();
		return observe;
	};
	// }}}

	// Destruction {{{
	/**
	* Destroys this object and deregisters it with the $observeProvider service
	* @param {string} method The reason we are being destroyed. ENUM: 'manual', 'selfDestruct'
	*/
	observe.destroy = function(method) {
		// INCLUDEIF $observeProvider: $observeProvider.deregister(observe); //
		observe.emit('destroy', method || 'manual');
		observe.isDestroyed = true;
	};


	/**
	* Check whether we should self-destruct
	* This should be called every time a hook is removed
	* @return {Object} This chainable object
	*/
	observe.checkSelfDestruct = function() {
		if (observe.selfDestruct && observe.selfDestructHooks.every(hook => !observe.hooks[hook] || !observe.hooks[hook].length)) { // All required hooks either don't exist or are empty
			observe.destroy('selfDestruct');
		}
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
