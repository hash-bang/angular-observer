angular.module('app', ['angular-observer'])
	.component('demoCtrl', {
		template: $element => $element.html(), // Slurp the inner contents of the component into the template (poor mans ng-controller)
		controller: function($observe) {
			var $ctrl = this;
			$ctrl.project = {};

			$ctrl.observer = $observe($ctrl, 'project')
				.on('init', _=> $ctrl.history.push({type: 'init'}))
				.on('change', _=> $ctrl.history.push({type: 'change', text: 'Change detected'}))
				.on('key', key => $ctrl.history.push({type: 'key', text: 'Top level key changed: ' + key}))
				.on('path', path => {
					if (path == 'project') return; // Omit the self-evident project changes
					$ctrl.history.push({type: 'path', text: 'Path changed: ' + path});
				})

			$ctrl.$doCheck = $observe.checkAll;

			// Watcher method tests {{{
			$ctrl.traverse = function() {
				$ctrl.observer.traverse((value, key, path)=> $ctrl.history.push({type: 'traverse', text: path.join('.') + '=' + value}));
			};
			// }}}

			// Event history tracking {{{
			$ctrl.history = [ // collection of {type, text}
				{type: 'boot', text: 'Initial demo startup'},
			];
			// }}}

			// Project randomisation controls {{{
			$ctrl.junkTerms = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'omicron', 'pi', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega'];

			/**
			* Populate a given object with sample data
			* @param {Object} root The root object to populate. Root will be mutated
			* @param {number} minBranches The minimum number of branches to populate
			* @param {number} [maxBranches] Optional maximum number of branches. If specified a random range between min and max is used, if omitted the exact number of minBranches is used
			*/
			$ctrl.randomizeObject = function(root, minBranches, maxBranches) {
				_.times(maxBranches === undefined ? minBranches : _.random(minBranches, maxBranches), function(i) {
					var key = _.sample($ctrl.junkTerms) + _.random(100, 999);
					var dice = _.random(0, 10);
					if (dice > 9) { // Make an array
						root[key] = [];
						_.times(_.random(1, 5), function() {
							root[key].push('arrayValue-' + _.sample($ctrl.junkTerms) + _.random(100, 999));
						});
					} else if (dice > 7) { // Make an object
						root[key] = {};
						$ctrl.randomizeObject(root[key], 1, 3);
					} else { // Make a scalar
						key = 'value-' + _.sample($ctrl.junkTerms) + _.random(100, 999);
						root[key] = _.sample($ctrl.junkTerms) + _.random(100, 999);
					}
				});
			};

			$ctrl.nextSequencial = 0;
			$ctrl.addSequencial = function() {
				var thisKey = $ctrl.nextSequencial++;
				$ctrl.project['key-' + thisKey] = 'val-' + thisKey;
			};


			/**
			* Clear the project and recreate the whole thing
			*/
			$ctrl.resetProject = function() {
				$ctrl.nextSequencial = 0;
				$ctrl.project = {title: 'project-' + _.sample($ctrl.junkTerms) + _.random(100, 999)};
				$ctrl.randomizeObject($ctrl.project, 5, 25);
				$ctrl.history.push({type: 'project', text: 'Reset'});
			};

			// Initalize main object
			$ctrl.resetProject();
			// }}}
		},
	});
