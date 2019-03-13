const gulp = require('gulp');
const sass = require('gulp-sass');
const plumber = require('gulp-plumber');
const newer = require('gulp-newer');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const server = require('browser-sync').create();
const minify = require('gulp-csso');
const rename = require('gulp-rename');
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');
const svgstore = require('gulp-svgstore');
const del = require('del');
const jsInclude = require('gulp-include');
const uglify = require('gulp-uglify');
const debug = require('gulp-debug');
const cached = require('gulp-cached');
const gulpif = require('gulp-if');
const argv = require('yargs').argv;
const sourcemaps = require('gulp-sourcemaps');
const  htmlmin = require('gulp-htmlmin');
// const  posthtml = require('gulp-posthtml');
// const  include = require('posthtml-include');
const pug = require('gulp-pug');

var PUBLIC_DEST = 'build';

var SOURCE_DEST = 'source';

var RESOURCES = 'assets';

gulp.task('images', () => {
  return gulp.src(`${SOURCE_DEST}/${RESOURCES}/img/**/*.{png,jpg,svg}`)
    .pipe(newer(`${PUBLIC_DEST}/${RESOURCES}/img`))
    .pipe(imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.jpegtran({progressive: true}),
      imagemin.svgo()
    ]))
    .pipe(debug({title: 'ImgMin'}))
    .pipe(gulp.dest(`${PUBLIC_DEST}/${RESOURCES}/img`));
});

gulp.task('webp', () => {
  return gulp.src(`${SOURCE_DEST}/${RESOURCES}/img/**/*.{png,jpg}`)
    .pipe(cached('webp'))
    .pipe(debug({title: 'cached'}))
    .pipe(webp({quality: 90}))
    .pipe(gulp.dest(`${PUBLIC_DEST}/${RESOURCES}/img`));
});

gulp.task('sprite', () => {
  return gulp.src(`${SOURCE_DEST}/${RESOURCES}/img/**/sprite-*.svg`)
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename('sprite.svg'))
    .pipe(debug({title: 'sprite-rename'}))
    .pipe(gulp.dest(`${PUBLIC_DEST}/${RESOURCES}/img/svg`));
});

gulp.task('minjs', () => {
  return gulp.src(`${SOURCE_DEST}/${RESOURCES}/js/main.js`)
    .pipe(plumber())
    .pipe(gulpif(!argv.prod, sourcemaps.init()))
    .pipe(jsInclude())
    .pipe(uglify())
    .pipe(rename('main.min.js'))
    .pipe(gulpif(!argv.prod, sourcemaps.write('./')))
    .pipe(gulp.dest(`${PUBLIC_DEST}/${RESOURCES}/js`));
});

// gulp.task('html', () => {
//   return gulp.src(${SOURCE_DEST} + '/*.html')
//     .pipe(posthtml([
//       include()
//     ]))
//     .pipe(htmlmin({
//       // collapseWhitespace: true,
//       removeComments: true
//     }))
//     .pipe(gulp.dest(PUBLIC_DEST));
// });

gulp.task('pug', () => {
  return gulp.src(`${SOURCE_DEST}/*.pug`)
    .pipe(plumber())
    .pipe(pug({pretty: true}))
    .pipe(htmlmin({
      //collapseWhitespace: true,
      removeComments: true
    }))
    .pipe(gulp.dest(PUBLIC_DEST))
});

gulp.task('clean', () => {
  return del(PUBLIC_DEST);
});

gulp.task('clearCache', () => {
  cached.caches.webp = {};
});

gulp.task('copy', () => {
  return gulp.src([
    `${SOURCE_DEST}/${RESOURCES}/fonts/**/*.{woff,woff2}`,
    `${SOURCE_DEST}/${RESOURCES}/js/picturefill.min.js`,
    'source/favicon.ico',
    'source/browserconfig.xml',
    'source/mstile-150x150.png',
    'source/safari-pinned-tab.svg',
    'source/site.webmanifest'
  ], {
    base: 'source'
  }).pipe(gulp.dest(PUBLIC_DEST));
});

gulp.task('style', (done) => {
  gulp.src(`${SOURCE_DEST}/sass/style.scss`)
    .pipe(plumber())
    .pipe(gulpif(!argv.prod, sourcemaps.init()))
    .pipe(sass())
    .pipe(postcss([
      autoprefixer()
    ]))
    .pipe(gulp.dest(`${SOURCE_DEST}/${RESOURCES}/css`))
    .pipe(minify())
    .pipe(rename('style.min.css'))
    .pipe(gulpif(!argv.prod, sourcemaps.write('./')))
    .pipe(gulp.dest(`${PUBLIC_DEST}/${RESOURCES}/css`))
    .pipe(server.stream());
  done();
});

gulp.task('refresh', (done) => {
  server.reload();
  done();
});

gulp.task('serve', () => {
  server.init({
    server: PUBLIC_DEST,
    notify: false,
    open: true,
    cors: true,
    ui: false
  });

  gulp.watch(`${SOURCE_DEST}/sass/**/*.{scss,sass}`, gulp.series('style'));
  gulp.watch(`${SOURCE_DEST}/${RESOURCES}/img/**/sprite-*.svg`, gulp.series('sprite', 'pug', 'refresh'));
  gulp.watch(`${SOURCE_DEST}/**/*.pug`, gulp.series('pug', 'refresh'));
  gulp.watch(`${SOURCE_DEST}/${RESOURCES}/js/**/*.js`, gulp.series('minjs', 'refresh'));
  gulp.watch(`${SOURCE_DEST}/${RESOURCES}/img/**/*.{png,jpg,gif,svg}`, gulp.series('images', 'webp'));
});

gulp.task('build', gulp.series('clean', 'images', 'webp', 'copy', 'minjs', 'style', 'sprite','pug'));
