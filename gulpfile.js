"use strict";

const gulp = require("gulp");
const sass = require("gulp-sass");
const  plumber = require("gulp-plumber");
const  newer = require("gulp-newer");
const  postcss = require("gulp-postcss");
const  autoprefixer = require("autoprefixer");
const  server = require("browser-sync").create();
const  minify = require("gulp-csso");
const  rename = require("gulp-rename");
const  imagemin = require("gulp-imagemin");
const  webp = require("gulp-webp");
const  svgstore = require("gulp-svgstore");
const  posthtml = require("gulp-posthtml");
const  include = require("posthtml-include");
const  del = require("del");
const  jsInclude = require("gulp-include");
const uglify = require("gulp-uglify");
const  htmlmin = require("gulp-htmlmin");
const  debug = require("gulp-debug");
const  cached = require("gulp-cached");

var PUBLIC_DEST = "build";

gulp.task("images", function() {
  return gulp.src("source/img/**/*.{png,jpg,svg}")
    .pipe(newer(PUBLIC_DEST + "/img"))
    .pipe(imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.jpegtran({progressive: true}),
      imagemin.svgo()
    ]))
    .pipe(debug({title: "ImgMin"}))
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
  return gulp.src("source/img/**/sprite-*.svg")
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename("sprite.svg"))
    .pipe(debug({title: "sprite-rename"}))
    .pipe(gulp.dest(PUBLIC_DEST + "/img/svg"));
});

gulp.task("minjs", function () {
  return gulp.src("source/js/main.js")
    .pipe(plumber())
    .pipe(jsInclude())
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
      // collapseWhitespace: true,
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

gulp.task("refresh", function(done) {
  server.reload();
  done();
});

gulp.task("serve", function() {
  server.init({
    server: PUBLIC_DEST,
    notify: false,
    open: true,
    cors: true,
    ui: false
  });

  gulp.watch("source/sass/**/*.{scss,sass}", gulp.series("style"));
  gulp.watch("source/img/**/sprite-*.svg", gulp.series("sprite", "html", "refresh"));
  gulp.watch("source/**/*.html", gulp.series("html", "refresh"));
  gulp.watch("source/js/**/*.js", gulp.series("minjs", "refresh"));
  gulp.watch("source/img/**/*.{png,jpg,gif,svg}", gulp.series("images", "webp"));
});

gulp.task("build", gulp.series("clean", "images", "webp", "copy", "minjs", "style", "sprite","html"));
