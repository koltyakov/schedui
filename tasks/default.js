//******************************************************************************
//* default.js
//*
//* Defines a custom gulp task that is default task if you just run
//* gulp on the command line in the repository root without any parameters. 
//******************************************************************************

"use strict";

//******************************************************************************
//* DEPENDENCIES
//******************************************************************************

var gulp = require("gulp"),
    runSequence = require("run-sequence");

//******************************************************************************
//* DEFAULT
//******************************************************************************

gulp.task("default", function(cb) {
    runSequence("lint", "build", "test", cb);
});