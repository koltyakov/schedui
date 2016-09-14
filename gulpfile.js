'use strict';

var gulp = require('gulp');
var tsc  = require('gulp-typescript');
var merge = require('merge2');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var postcss = require('gulp-postcss');
var sass = require('gulp-sass');
var autoprefixer = require('autoprefixer');
var lost = require('lost');
var browserSync = require('browser-sync').create();

var tsProject = tsc.createProject('tsconfig.json', {
    typescript: require('typescript')
});

gulp.task('html', function() {
    browserSync.reload();
    return gulp.src('src/index.html')
        .pipe(gulp.dest('dist'));
});

gulp.task('css', function () {
    var processors = [ autoprefixer, lost ];
    browserSync.reload();
    return gulp.src('src/scss/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss(processors))
        //.pipe(concat('schedui.css'))
        .pipe(gulp.dest('dist/css'));
});

gulp.task('css:images', function () {
    browserSync.reload();
    return gulp.src('src/scss/images/*.*')
        .pipe(gulp.dest('dist/css/images'));
});

gulp.task('tsc', function () {
    browserSync.reload();
    return  gulp.src('src/ts/**/*.ts')
        .pipe(tsc(tsProject))
        .pipe(gulp.dest('dist/js'));
});

gulp.task('minjs', ['tsc'], function () {
    return gulp.src('dist/js/schedui.js')
        .pipe(concat('schedui.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'));
});

gulp.task('build', ['minjs', 'css', 'css:images', 'html'], function() {
    browserSync.reload();
});

gulp.task('serve', ['minjs', 'css', 'css:images', 'html'], function() {
    browserSync.init({
        server: {
            baseDir: './dist',
            index: 'index.html'
        }
    });

    gulp.watch('src/ts/**/*.ts', ['minjs']);
    gulp.watch('src/scss/**/*.scss', ['css']);
    gulp.watch('src/index.html', ['html']);
});

gulp.task('default', ['serve']);