Angular-Observer
================
Observe mutations to a scalar, object or array.

Features:

* Watch an object hierarchically by path
* Fully-featured event system - `emit(), on()`, `one()`, `once()`, `off()` are all supported


```javascript
angular
	.module('app')
	.component('myComponent', {
		controller: function($observe) {

			// Assign observe to run on each Angular update cycle
			this.doCheck = $watch.cycle;

			// Watch something
			this.myObj = {foo: 'Foo!', bar: 'Bar!', baz: 'Baz!'};

			$observe(this, 'myObj')
				.on('change', _=> console.log('Object changed in some way'))
				.on('key', (key, newVal, oldVal) => console.log('Key', key, 'Changed', oldVal, '=>', newVal))
				// Other events: keyDelete, keyAdd

		},
	});
```


Installation
============
1. Add `angular-observer` as a module in your main `angular.module()` call.
2. Include the service somewhere in your project by either loading the `angular-observer.js` file or rolling into your minifier / webpack / concat process of choice.
3. Add `$observe` as a depdenency to any controller you wish to use it in.


For a more complex example see the [demo](demo/) directory.


Migration
=========
The `$observe()` call is compatible with Angulars `$watch()`, `$watchGroup()` and `$watchCollection()` with minimal changes.

Since `$observe()` can mix-and-match these approches it is also possible that we can support hybrid observers such as deep, multi-collection watching.


$scope.$watch(path | func, callback)
------------------------------------
You can use any of the following patterns:

* `$observe(this, path, callback)`
* `$observe(this, path).on('change', callback)`


$scope.$watch(path | func, callback, true)
------------------------------------------
Deep watching can be acomplished with any of the following:

* `$observe(this, path, callback, true)`
* `$observe(this, path, {deep: true}).on('change', callback)`
* `$observe.deep(this, path, callback)`
* `$observe.deep(this, path).on('change', callback)`


$scope.$watchGroup(paths..., callback)
--------------------------------------
Path can already be an array in a $observe call so any of the usage patterns available with a regular `$observe()` call will all work.


$scope.$watchCollection(path | func, callback)
----------------------------------------------
Watching a collection with `$observe()` is essencially just specifying that the `depth = 2` (watch only the immediate array indexes AND the keys of the sub-object).

Any of the following patterns should work:

* `$observe(this, path, callback, 2)`
* `$observe(this, path, {deep: 2}).on('change', callback)`
* `$observe.deep(this, path, callback, 2)`
* `$observe.deep(this, path, 2).on('change', callback)`


API
===
The below API repersents the developer-facing functionality. For a full list of functions, methods and variables please read the source code JSDoc comments instead.


$observe(scope, path, [callback], [config])
-------------------------------------------
The main Observer worker.
Calling this function factory with a scope and a path will register an observer worker against it. Any changes will then fire events.

```javascript
controller: function($observe) {
	$observe(this, 'myAmazingObject')
		.on('change', _=> console.log('Object changed in some way'))

	// Tell Angular to run all checks each digest cycle
	$ctrl.$doCheck = $observe.checkAll;
},
```

See the [Events](#events) section for what events can be listened for.

This returns an Observable.

Callback is optional, if provided it will be automatically bound with `Observable.on('change', CALLBACK)`.

Config is an optional object of options to configure $observe's behaviour. If `config` is a number it will be assumed that `{deep: CONFIG}` was specified.

| Option | Type             | Default | Description                                                                                         |
|--------|------------------|---------|-----------------------------------------------------------------------------------------------------|
| `deep` | `true` OR Number | `1`     | The maximum depth to iterate when watching a target. If the value is `true` all levels are examined |
| `root` | `true` OR String | `true`  | If a string is specified all paths used in event emitters are made relative to the one specified, if true the relative path is calculated from the provided paths only if a single path was specified (this replicates the default behaviour of Angular) |


$observe.checkAll()
-------------------
An alias function for `$observeProvider.checkAll()`.


Observable.check()
------------------
Runs a check on the observe target and fires any events.

You probably don't need to interact with this method directly. Instead use `$ctrl.$doCheck = $observe.checkAll` to tell Angular to run *all* checks on each digest cycle.


Observable.checkAll()
---------------------
An alias function for `$observeProvider.checkAll()`.


Observable.get([path])
----------------------
Fetch the object being observed or a path within it.


Observable.destroy()
--------------------
Destroy the observer and deregister it with `$observeProvider` so it no longer receieves updates.


Observable.isModified([path])
-----------------------------
If called with no path this function returns an array of all modified paths within the object.
If given a specific path to examine this function returns a boolean indicating if that path has been modified.


Observable.traverse([callback], [path])
---------------------------------------
Run a callback on every item within the current object.


$observeProvider
----------------
The overseeing observer system. This also allows management of any registered observer processes.


$observeProvider.checkAll()
-----------------------------------
Run `check()` on all registed `$observe` objects. This is also accessable as `$observe.checkAll()`.


Events
------
The following events can be attached to any Observable instance:

| Event        | Parameters         | Description                                                                                     |
|--------------|--------------------|-------------------------------------------------------------------------------------------------|
| `change`     | `(newValue)`       | Emitted if any part of the observable target changes                                            |
| `destroy`    | `()`               | Emitted when the observer is destroyed                                                          |
| `key`        | `(key, newValue)`  | Emitted if the observable target is an object and any of the *top level only* key values change |
| `path`       | `(path, newValue)` | Emitted if any deeply nested paths change within the observable                                 |
| `postChange` | `(newValue)`       | Emitted after all other keys have finished before the next injection stage                      |
| `postInject` | `(newValue)`       | Emitted after the object has been 'sealed' again before the next check cycle                    |
| `finally`    | `()`               | Emitted after all other hooks have been called                                                  |


TODO
====

* [x] Emitters that can only fire once
* [x] Config parameter - `$observe(scope, path, config)`
* [x] Callbacks without events - `$observe([scope], path, callback)`
* [x] Deep watching  via `config.deep = true`
* [x] Depth specifier via `$observe(scope, path, [callback], depth)`
* [x] Depth specifier via `config.depth = Boolean | Number`
* [x] Paths can be arrays (for group support)
* [ ] Ignore paths array - `Observer.ignore(path...)`
* [x] Relative paths (defaults to true if only one path is being watched)
* [ ] Path globbing
* [ ] Old values in emitters
* [x] Observer destruction
* [ ] Observer pausing
* [ ] Setting - ignore initial undefined
