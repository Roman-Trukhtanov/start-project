"use strict";

var gulp = require("gulp");
var sass = require("gulp-sass");
var plumber = require("gulp-plumber");
var newer = require("gulp-newer");
var postcss = require("gulp-postcss");
var autoprefixer = require("autoprefixer");
var server = require("browser-sync").create();
var minify = require("gulp-csso");
var rename = require("gulp-rename");
var imagemin = require("gulp-imagemin");
var webp = require("gulp-webp");
var svgstore = require("gulp-svgstore");
var posthtml = require("gulp-posthtml");
var include = require("posthtml-include");
var run = require("run-sequence");
var del = require("del");
var uglify = require("gulp-uglify");
var htmlmin = require("gulp-htmlmin");
var debug = require("gulp-debug");
var cached = require("gulp-cached");

var PUBLIC_DEST = "build";

gulp.task("images", function() {
  return gulp.src("source/img/**/*.{png,jpg,svg}")
    .pipe(newer(PUBLIC_DEST + "/img"))
    .pipe(imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.jpegtran({progressive: true}),
      imagemin.svgo()
    ]))
    .pipe(gulp.dest(PUBLIC_DEST + "/img"));
});

gulp.task("webp", function() {
  return gulp.src("source/img/**/*.{png,jpg}")
    .pipe(cached("webp"))
    .pipe(debug({title: "cached"}))
    .pipe(webp({quality: 90}))
    .pipe(gulp.dest(PUBLIC_DEST + "/img"));
});

gulp.task("sprite", function() {
  return gulp.src("source/img/sprite-*.svg")
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename("sprite.svg"))
    .pipe(gulp.dest(PUBLIC_DEST + "/img"));
});

gulp.task("minjs", function () {
  return gulp.src("source/js/main.js")
    .pipe(uglify())
    .pipe(rename("main.min.js"))
    .pipe(gulp.dest(PUBLIC_DEST + "/js"));
});

gulp.task("html", function() {
  return gulp.src("source/*.html")
    .pipe(posthtml([
      include()
    ]))
    .pipe(htmlmin({
      collapseWhitespace: true,
      removeComments: true
    }))
    .pipe(gulp.dest(PUBLIC_DEST));
});

gulp.task("clean", function() {
  return del(PUBLIC_DEST);
});

gulp.task("clearCache", function () {
  cached.caches.webp = {};
});

gulp.task("copy", function() {
  return gulp.src([
    "source/fonts/**/*.{woff,woff2}",
    "source/js/picturefill.min.js"
  ], {
    base: "source"
  }).pipe(gulp.dest(PUBLIC_DEST));
});

gulp.task("style", function(done) {
  gulp.src("source/sass/style.scss")
    .pipe(plumber())
    .pipe(sass())
    .pipe(postcss([
      autoprefixer()
    ]))
    .pipe(gulp.dest("source/css"))
    .pipe(minify())
    .pipe(rename("style.min.css"))
    .pipe(gulp.dest(PUBLIC_DEST + "/css"))
    .pipe(server.stream());
  done();
});

var runImageOptim = function () {
  gulp.series("images", "webp");
};

gulp.task("serve", function() {
  server.init({
    server: PUBLIC_DEST,
    notify: false,
    open: true,
    cors: true,
    ui: false
  });

  gulp.watch("source/sass/**/*.{scss,sass}", gulp.series("style"));
  gulp.watch("source/*.html", gulp.series("html")).on("change", server.reload);
  gulp.watch("source/js/*.js", gulp.series("minjs")).on("change", server.reload);
  gulp.watch("source/img/**/*.{png,jpg}", runImageOptim);
});

gulp.task("build", gulp.series("clean", "images", "webp", "copy", "minjs", "style", "sprite","html"));
