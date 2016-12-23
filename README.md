Obsvr
=====
Swiss-army knife for observation of objects (Angular compatible).

Features:

* Watch an object hierarchically by path
* Fully-featured event system - `emit(), on()`, `one()`, `once()`, `off()` are all supported
* Self-destructing watchers - remove the watcher completely when no other hooks are present (works well with `once` / `one` event handlers to only capture one change then stop watching)
* Ability to ignore initial variable states (see the `ignoreInitial` option)
* Blazingly fast - by default (change by setting `method`) the data object is mutated into setters/getters where each data change is detected in a function and recorded. *No deep object traversal is performed* - state changes detection is done exclusively via callbacks. For more optimizations see the `scanKeyChange` property.
* Configurable path seperator - integrate with globbing libraries or regular expressions easier by changing dotted notation (e.g. `foo.bar.baz`) to something else


**NOTE**: This project is primarily designed for integration into Angular but works perfectly well within Node as per the [test suite](test/).

For a more complex example of this libraries capabilies see the [demo](demo/) directory for a fully working Angular integration.


Examples
--------
### General use within an Angular component

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

The examples below all assume that you are using `$observe` within a similar structure, the Component wrapping is omitted for brevity.


### React to a change ONCE when everything has been set

The following uses several techniques to only fire an observer once:

```javascript
$observe(this, ['path1', 'path2', 'path3'])
	.once(function() {
		// We only run this function if path1, path2 and path3 are not undefined!
		// Since this is also inside a 'once' this observer will also self-destruct
	})
```

Whats happening here:

1. `$observe` is being passed multiple paths (similar to a `$scope.$watchGroup` in Angular)
2. Since no parameters are passed, default parameters are used including `{ignoreInitial: 'any', selfDestruct: true}`
3. As `ignoreInitial = 'any'` we ignore the initial undefined states of the paths until all are set
4. As a `once()` hook is being used and `selfDestruct = true` we detect that no further hooks are waiting and destroy the watcher automatically




Installation within Angular
===========================
1. Add `angular-obsvr` as a module in your main `angular.module()` call.
2. Include the service somewhere in your project by either loading the `dist/angular-obsvr.js` file or rolling into your minifier / webpack / concat process of choice.
3. Add `$observe` as a dependency to any controller you wish to use it in.


Migration
=========
The `$observe()` call is compatible with Angular's `$watch()`, `$watchGroup()` and `$watchCollection()` with a few small changes.

A `$observe()` can mix-and-match several approaches support is possible for hybrid observers such as combining deep, multi-collection watching where we can ignore the initial unset state.


$scope.$watch(path | func, callback)
------------------------------------
You can use any of the following patterns:

* `$observe(this, path, callback)`
* `$observe(this, path).on('change', callback)`


$scope.$watch(path | func, callback, true)
------------------------------------------
Deep watching can be accomplished with any of the following:

* `$observe(this, path, callback, true)`
* `$observe(this, path, {deep: true}).on('change', callback)`
* `$observe.deep(this, path, callback)`
* `$observe.deep(this, path).on('change', callback)`


$scope.$watchGroup(paths..., callback)
--------------------------------------
Path can already be an array in a $observe call so any of the usage patterns available with a regular `$observe()` call will all work.


$scope.$watchCollection(path | func, callback)
----------------------------------------------
Watching a collection with `$observe()` is essentially just specifying that the `depth = 2` (watch only the immediate array indexes AND the keys of the sub-object).

Any of the following patterns should work:

* `$observe(this, path, callback, 2)`
* `$observe(this, path, {deep: 2}).on('change', callback)`
* `$observe.deep(this, path, callback, 2)`
* `$observe.deep(this, path, 2).on('change', callback)`


API
===
The below API represents the developer-facing functionality. For a full list of functions, methods and variables please read the source code JSDoc comments instead.

General notes:

* By default `$observe()` will ignore the initial undefined values (`ignoreInitial=any`) which differs from Angular's default behaviour of always triggering a `$scope.$watch` callback at least once. If you want this behaviour pass `{ignoreIntial: 'never'}` as a parameter.


$observe(scope, path, [callback], [config | depth])
---------------------------------------------------
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

Config is an optional object of options to configure `$observe`'s behaviour. If `config` is a number it will be assumed that `{deep: CONFIG}` was specified.

| Option              | Type             | Default   | Description                                                                                         |
|---------------------|------------------|-----------|-----------------------------------------------------------------------------------------------------|
| `deep`              | `true` OR Number | `1`       | The maximum depth to iterate when watching a target. If the value is `true` all levels are examined |
| `hookWarnings`      | Boolean          | `true`    | When enabled extra checks are preformed for common hook name misspellings                           |
| `ignoreInitial`     | String           | `"any"`   | Ignore initial values (the first time a target is set). Values are: `"never"` / `false` - always trigger the change event even if any / all of the initial values are `undefined`, `"any"` - ignore the initial change detection if _any_ of the values watched are `undefined`, `"all"` - ignore initial change detection if _all_ of the values are `undefined` |
| `method`            | String           | `setters` | The method used to watch the object. Can be one of: `dirty` - use dirty checking, very slow but accurate, `setters` - inject getters/setters to every primitive very fast but cannot property detect key additions / deletions (see `scanKeyChange` for this) |
| `root`              | `true` OR String | `true`    | If a string is specified all paths used in event emitters are made relative to the one specified, if true the relative path is calculated from the provided paths only if a single path was specified (this replicates the default behaviour of Angular) |
| `scanKeyChange`     | Boolean          | `true`    | Scan for key additions / deletions. There is a **major** performance boost to disabling this but it renders `$observe()` unable to detect any changes to existing objects. It is highly recommended you enable this if you have a relatively static data set or your data set is being brought from a remote database with all the keys mapped (Angular-Resource for example) |
| `selfDestruct`      | Boolean          | `true`    | Whether the object should call `Observer.destruct()` when all the hooks listed in `selfDestructHooks` are empty. Set this to false if you intend to dynamically attach hooks to the Observer object at a later date |
| `selfDestructHooks` | Array            | `['change', 'key', 'path']` | What hooks to watch if `selfDestruct=true`                                      |
| `seperator`         | String           | `.`       | The path definition seperator. Change this to forward slashes or something if you want to integrate with a globbing library |


$observe.deep(scope, path, [callback], [config | depth])
--------------------------------------------------------
A convenience function to call `$observe` with `{deep: true}` set as a config parameter.


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
Destroy the observer and deregister it with `$observeProvider` so it no longer receives updates.


Observable.isModified([path])
-----------------------------
If called with no path this function returns an array of all modified paths within the object.
If given a specific path to examine this function returns a boolean indicating if that path has been modified.


Observable.traverse([callback], [path])
---------------------------------------
Run a callback on every item within the current object.


$observeProvider
----------------
The overseeing observer system (Angular only). This also allows management of any registered observer processes.


$observeProvider.checkAll()
-----------------------------------
Run `check()` on all registered `$observe` objects. This is also accessible as `$observe.checkAll()`.


Events
------
The following events can be attached to any Observable instance via `on`, `one` / `once` and can be removed with `off`.

| Event        | Parameters         | Description                                                                                     |
|--------------|--------------------|-------------------------------------------------------------------------------------------------|
| `change`     | `(newValue)`       | Emitted if any part of the observable target changes                                            |
| `destroy`    | `(method)`         | Emitted when the observer is destroyed method can be 'manual' or 'selfDestruct'                 |
| `key`        | `(key, newValue)`  | Emitted if the observable target is an object and any of the *top level only* key values change |
| `path`       | `(path, newValue)` | Emitted if any deeply nested paths change within the observable                                 |
| `postChange` | `(newValue)`       | Emitted after all other keys have finished before the next injection stage                      |
| `postInject` | `(newValue)`       | Emitted after the object has been 'sealed' again before the next check cycle                    |
| `finally`    | `()`               | Emitted after all other hooks have been called                                                  |
| `initial`    | `(newValue)`       | Emitted on the first change detection. Not if `ignoreInitial` is set this can fire multiple times as the Observer will assume any `undefined` value is still an initial value |


TODO
====

* [x] Object.defineProperty optimisations
* [x] Emitters that can only fire once
* [x] Config parameter - `$observe(scope, path, config)`
* [x] Callbacks without events - `$observe([scope], path, callback)`
* [x] Deep watching  via `config.deep = true`
* [x] Depth specifier via `$observe(scope, path, [callback], depth)`
* [x] Depth specifier via `config.depth = Boolean | Number`
* [x] Paths can be arrays (for group support)
* [ ] Ignore paths array - `Observer.ignore(path...)`
* [x] Relative paths (defaults to true if only one path is being watched)
* [ ] Old values provided to emitters
* [x] Observer destruction
* [x] Observer auto-destruction when no hooks remain
* [ ] Observer pausing
* [x] Ignore initial undefined
* [ ] Integration with this.$changes
* [ ] Observer.set(PATH, value)
* [ ] Observer.merge(object)
* [ ] Path globbing
* [ ] Multiple watchers on the same object but different paths
