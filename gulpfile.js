var babel = require('gulp-babel');
var gulp = require('gulp');
var fs = require('fs');
var rename = require('gulp-rename');
var replace = require('gulp-replace');

gulp.task('default', ['build']);

gulp.task('build', function () {
	gulp.src('./src/angular-observer.js')
		.pipe(rename('angular-observer.js'))
		.pipe(replace(/\/\/ INCLUDE src\/observer\.js \/\//, fs.readFileSync('./src/observer.js', 'utf-8')))
		.pipe(replace(/^.*require\(.*\);\s+$/gm, ''))
		.pipe(replace(/^.*module\.exports = .*$/gm, ''))
		.pipe(replace(/setTimeout\(/, '$timeout('))
		.pipe(replace(/\/\/ INCLUDEIF \$observeProvider: (.+?) \/\//g, '$1'))
		.pipe(babel({presets: ['es2015']}))
		.pipe(replace(/^'use strict';$/gm, ''))
		.pipe(gulp.dest('./dist'));
});
