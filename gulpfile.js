'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');
var browserify = require('browserify');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var through2 = require('through2');
var path = require('path');
var streamify = require('gulp-streamify');
var source = require('vinyl-source-stream');
var bom = require('gulp-bom');

function assets() {
    return gulp.src('assets/**/*', {base:"./assets"})
        .pipe(gulp.dest('dist'));
}

function data() {
    return gulp.src('data/**/*', {base:"."})
        .pipe(gulp.dest('dist'));
}

function css() {
    return gulp.src('./lens.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(rename('lens.css'))
        .pipe(gulp.dest('./dist'));
}

function bundle() {
    return gulp.src('./embedded.js')
        .pipe(through2.obj(function (file, enc, next) {
            browserify(file.path)
                .ignore(require.resolve('pdfjs-dist/build/pdf.worker')) // Reducing size
                .bundle(function (err, res) {
                    if (err) { return next(err); }
                    file.contents = res;
                    next(null, file);
                });
        }))
        .on('error', function (error) {
            console.log(error.stack);
            this.emit('end');
        })
        .pipe(uglify())
        .pipe(rename('lens.js'))
		.pipe(bom())
        .pipe(gulp.dest('./dist'));
}

function worker() {
    // We can create our own viewer (see worker.js) or use already defined one.
    var workerSrc = require.resolve('pdfjs-dist/build/pdf.worker.entry');

    return browserify(workerSrc, { output: 'lens.worker.tmp', })
        .bundle()
        .pipe(source('lens.worker.tmp'))
        .pipe(streamify(uglify({
            compress: {
                sequences: false, // Chrome has issue with the generated code if true
            },
        })))
        .pipe(rename('lens.worker.js'))
        .pipe(gulp.dest('./dist'));
}

exports.default = gulp.series(assets, data, css, bundle, worker);
