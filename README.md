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


API
===
The below API repersents the developer-facing functionality. For a full list of functions, methods and variables please read the source code JSDoc comments instead.


$observe(scope, path)
---------------------
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


Observable.traverse([callback])
-------------------------------
Run a callback on every item within the current object


Observable.isModified([path])
-----------------------------
If called with no path this function returns an array of all modified paths within the object.
If given a specific path to examine this function returns a boolean indicating if that path has been modified.


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
| `key`        | `(key, newValue)`  | Emitted if the observable target is an object and any of the *top level only* key values change |
| `path`       | `(path, newValue)` | Emitted if any deeply nested paths change within the observable                                 |
| `postChange` | `(newValue)`       | Emitted after all other keys have finished before the next injection stage                      |
| `postInject` | `(newValue)`       | Emitted after the object has been 'sealed' again before the next check cycle                    |


TODO
====

* [ ] Emitters that can only fire once
* [ ] Config parameter - `$observe(scope, path, config)`
* [ ] Callbacks without events - `$observe([scope], path, callback)`
* [ ] Deep watching  via `config.deep = true`
* [ ] Depth specifier via `$observe(scope, path, [callback], depth)`
* [ ] Depth specifier via `config.depth = Boolean | Number`
* [ ] Paths can be arrays (for group support)
* [ ] Backwards port fix - `$observe.collection(scope, path)`
* [ ] Ignore paths array - `Observer.ignore(path...)`
