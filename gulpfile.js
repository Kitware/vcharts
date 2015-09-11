var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat');

gulp.task('js', function () {
    gulp.src('./js/*.js')
        .pipe(concat('vcharts.js'))
        .pipe(gulp.dest('./dist/'))
        .pipe(uglify())
        .pipe(concat('vcharts.min.js'))
        .pipe(gulp.dest('./dist/'));
});

gulp.task('default', ['js']);
