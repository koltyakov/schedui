//******************************************************************************
//* build-typings.js
//* 
//* Defines a custom gulp task for compiling TypeScript source code into
//* js files, omitting unit tests.
//******************************************************************************

"use strict";

//******************************************************************************
//* DEPENDENCIES
//******************************************************************************

var gulp = require("gulp"),
    tsc = require("gulp-typescript");

//******************************************************************************
//* BUILD-TYPINGS
//******************************************************************************

gulp.task("build-typings", ["clean"], function() {
    var src = global.TSWorkspace.Files.slice(0);
    src.push(global.TSTypings.Main);
    src.push("!src/*.test.ts");
    src.push("!src/**/*.test.ts");

    // create a project specific to our typings build and specify the outFile. This will result
    // in a single pnp.d.ts file being creating and piped to the typings folder
    var typingsProject = tsc.createProject('tsconfig.json', { declaration: true });

    return gulp.src(src)
        .pipe(tsc(typingsProject))
        .dts.pipe(gulp.dest(global.TSCompiledOutput.RootFolder));
});