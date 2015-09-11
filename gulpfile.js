var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat');

gulp.task('js', function () {
    gulp.src('./js/*.js')
        .pipe(concat('vcharts.js'))
        .pipe(gulp.dest('.'))
        .pipe(uglify())
        .pipe(concat('vcharts.min.js'))
        .pipe(gulp.dest('.'));
});

gulp.task('default', ['js']);
