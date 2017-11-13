'use strict';

var gulp = require('gulp');
var tsc = require('gulp-typescript');
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

gulp.task('html', () => {
  browserSync.reload();
  return gulp.src('src/**/*.html').pipe(gulp.dest('dist'));
});

gulp.task('css', () => {
  var processors = [autoprefixer, lost];
  browserSync.reload();
  return (gulp
    .src('src/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss(processors))
    .pipe(gulp.dest('dist')) );
});

gulp.task('css:images', () => {
  browserSync.reload();
  return gulp.src('src/images/*.*').pipe(gulp.dest('dist/images'));
});

gulp.task('tsc', () => {
  browserSync.reload();
  return gulp
    .src('src/**/*.ts')
    .pipe(tsProject())
    .pipe(gulp.dest('dist'));
});

gulp.task('minjs', ['tsc'], () => {
  return gulp
    .src('dist/scripts/schedui.js')
    .pipe(concat('schedui.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dist/scripts'));
});

gulp.task('build', ['minjs', 'css', 'css:images', 'html'], () => {
  browserSync.reload();
});

gulp.task('serve', ['minjs', 'css', 'css:images', 'html'], () => {
  browserSync.init({
    server: {
      baseDir: './dist',
      index: 'example/index.html'
    }
  });
  gulp.watch('src/**/*.ts', ['minjs']);
  gulp.watch('src/**/*.scss', ['css']);
  gulp.watch('src/**/*.html', ['html']);
});

gulp.task('default', ['serve']);
