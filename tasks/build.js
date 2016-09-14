//******************************************************************************
//* build.js
//* 
//* Defines a custom gulp task for compiling TypeScript source code into
//* js files.  It outputs the details as to what it generated to the console.
//******************************************************************************

"use strict";

//******************************************************************************
//* DEPENDENCIES
//******************************************************************************

var gulp = require("gulp"),
    tsc = require("gulp-typescript"),
    debug = require('gulp-debug'),
    plumber = require('gulp-plumber');

//******************************************************************************
//* BUILD
//******************************************************************************
gulp.task("build", ["clean", "lint", "build-typings"], function () {
    var src = global.TSWorkspace.Files.slice(0);
    src.push(global.TSTypings.Main);

    return gulp.src(src)
        .pipe(plumber())
        .pipe(tsc(global.tsProject))
        .pipe(debug({ title: "build output:" }))
        .pipe(gulp.dest(global.TSCompiledOutput.RootFolder));
});

gulp.task("build-serve", function () {
    var src = global.TSWorkspace.Files.slice(0);
    src.push(global.TSTypings.Main);

    return gulp.src(src)
        .pipe(plumber())
        .pipe(tsc(global.tsProject))
        .pipe(gulp.dest(global.TSCompiledOutput.RootFolder));
});

