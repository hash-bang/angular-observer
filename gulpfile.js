var babel = require('gulp-babel');
var gulp = require('gulp');
var rename = require('gulp-rename');
var replace = require('gulp-replace');

gulp.task('default', ['build']);

gulp.task('build', function () {
	gulp.src('./src/observer.js')
		.pipe(rename('angular-observer.js'))
		.pipe(replace(/^.*require\(.*\);\s+$/gm, ''))
		.pipe(replace(/setTimeout\(/, '$timeout('))
		.pipe(replace(/\/\/ INCLUDEIF \$observeProvider: (.+?) \/\//g, '$1'))
		.pipe(babel({presets: ['es2015']}))
		.pipe(gulp.dest('./dist'));
});
