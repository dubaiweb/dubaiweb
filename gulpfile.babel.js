import gulp from "gulp";
import {spawn} from "child_process";
import hugoBin from "hugo-bin";
import gutil from "gulp-util";
import flatten from "gulp-flatten";
import postcss from "gulp-postcss";
import cssImport from "postcss-import";
import cssnext from "postcss-preset-env";
import util from "postcss-utilities";
import precss from "precss";
import rucksack from "rucksack-css";
import nano from "gulp-cssnano";
import sourcemaps from "gulp-sourcemaps";
import sass from "gulp-sass";
import BrowserSync from "browser-sync";
import webpack from "webpack";
import webpackConfig from "./webpack.conf";
import imagemin from "gulp-imagemin";
import webp from "gulp-webp";
import imageResize from "gulp-image-resize";
import newer from "gulp-newer";
import rename from "gulp-rename";
import notify from "gulp-notify";
import responsive from "gulp-responsive";

const browserSync = BrowserSync.create();

const processors = [
  cssImport({ from: "./src/css/main.css" }),
  precss(),
  rucksack(),
  util(),
  cssnext()
];

const imgOpt = [
  imagemin.gifsicle({interlaced: true}),
  imagemin.jpegtran({progressive: true}),
  imagemin.optipng({optimizationLevel: 5})
];

const imgSrcP = './src/sina/hoch/*.jpg';
const imgDestP = './site/static/sina/hoch';

const imgSrcL = './src/sina/quer/*.jpg';
const imgDestL = './site/static/sina/quer';

const artist = "site/sinalocal.toml";


// Hugo arguments
// const hugoArgsDefault = ["-d", "../dist", "-s", "site", "-v"];
const hugoArgsDefault = ["-d", "../dist", "-s", "site", "-v", "--config", artist];
const hugoArgsPreview = ["--buildDrafts", "--buildFuture"];

// Development tasks
gulp.task("hugo", (cb) => buildSite(cb));
gulp.task("hugo-preview", (cb) => buildSite(cb, hugoArgsPreview));

// Run server tasks
gulp.task("server", ["hugo", "css", "js"], (cb) => runServer(cb));
gulp.task("server-preview", ["hugo-preview", "css", "js"], (cb) => runServer(cb));

// Build/production tasks
gulp.task("build", ["css", "js"], (cb) => buildSite(cb, [], "production"));
gulp.task("build-preview", ["css", "js"], (cb) => buildSite(cb, hugoArgsPreview, "production"));

gulp.task("css", () => (
  gulp.src("./src/css/*.css")
    .pipe(sourcemaps.init())
    .pipe(postcss(processors))
    // .pipe(nano())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest("./dist/css"))
    .pipe(browserSync.stream())
));

gulp.task('sass', () => (
  gulp.src('./src/css/uikit/swissness.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./src/css/imports'))
));

gulp.task("js", (cb) => {
  const myConfig = Object.assign({}, webpackConfig);

  webpack(myConfig, (err, stats) => {
    if (err) throw new gutil.PluginError("webpack", err);
    gutil.log("[webpack]", stats.toString({
      colors: true,
      progress: true
    }));
    browserSync.reload();
    cb();
  });
});

gulp.task('picp', function() {
  return gulp.src(imgSrcP)
    .pipe(responsive({
      '*.jpg': [{
        width: 480,
        rename: { suffix: '-375px' },
      }, {
        width: 600,
        rename: { suffix: '-420px' },
      }, {
        width: 800,
        rename: { suffix: '-640px' },
      }, {
        // Compress, strip metadata, and rename original image
        rename: { suffix: '' },
      }],
    }, {
      quality: 70,
      progressive: true,
      withMetadata: false,
    }))
    .pipe(gulp.dest(imgDestP));
});

gulp.task('picl', function() {
  return gulp.src(imgSrcL)
    .pipe(responsive({
      // Resize all JPG images to three different sizes: 200, 500, and 630 pixels
      '*.jpg': [{
        width: 600,
        rename: { suffix: '-420px' },
      }, {
        width: 1200,
        rename: { suffix: '-800px' },
      }, {
        width: 1600,
        rename: { suffix: '-1280px' },
      }, {
        // Compress, strip metadata, and rename original image
        rename: { suffix: '' },
      }],
    }, {
      quality: 70,
      progressive: true,
      withMetadata: false,
    }))
    .pipe(gulp.dest(imgDestL));
});

gulp.task('img', () =>
  gulp.src(imgSrc)
  // .pipe(newer(imgDest))
  .pipe(imagemin(imgOpt))
  .pipe(gulp.dest(imgDest))
);

function runServer() {
  browserSync.init({
    server: {
      baseDir: "./dist"
    }
  });
  gulp.watch("./src/js/**/*.js", ["js"]);
  gulp.watch("./src/css/**/*.css", ["css"]);
  gulp.watch("./src/css/uikit/**/*.scss", ["sass"]);
  gulp.watch("./site/**/*", ["hugo"]);
}

function buildSite(cb, options, environment = "development") {
  const args = options ? hugoArgsDefault.concat(options) : hugoArgsDefault;

  process.env.NODE_ENV = environment;

  return spawn(hugoBin, args, {stdio: "inherit"}).on("close", (code) => {
    if (code === 0) {
      browserSync.reload();
      cb();
    } else {
      browserSync.notify("Hugo build failed :(");
      cb("Hugo build failed");
    }
  });
}
