var annotate = require('gulp-ng-annotate');
var babel = require('gulp-babel');
var gulp = require('gulp');
var fs = require('fs');
var rename = require('gulp-rename');
var replace = require('gulp-replace');
var uglify = require('gulp-uglify');

gulp.task('default', ['build']);

gulp.task('build', function () {
	gulp.src('./src/angular-obsvr.js')
		.pipe(rename('angular-obsvr.js'))
		.pipe(replace(/\/\/ INCLUDE src\/obsvr\.js \/\//, fs.readFileSync('./src/obsvr.js', 'utf-8')))
		.pipe(replace(/^.*require\(.*\);\s+$/gm, ''))
		.pipe(replace(/^.*module\.exports = .*$/gm, ''))
		.pipe(replace(/setTimeout\(/, '$timeout('))
		.pipe(replace(/\/\/ INCLUDEIF \$observeProvider: (.+?) \/\//g, '$1'))
		.pipe(babel({presets: ['es2015']}))
		.pipe(replace(/^'use strict';$/gm, ''))
		.pipe(annotate())
		.pipe(uglify({mangle: false}))
		.pipe(gulp.dest('./dist'));
});
