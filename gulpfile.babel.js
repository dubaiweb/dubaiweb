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

var argv  = require('minimist')(process.argv);

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

const imgSrc = './src/photos/**';
const imgDest = './site/static/photos';

if (argv.main) {
  const conf = "site/main.toml";
} else if (argv.mainl) {
  const conf = "site/mainlocal.toml";
} else if (argv.sina) {
  const conf = "site/sina.toml";
} else if (argv.sinal) {
  const conf = "site/sinalocal.toml";
} else {
  const conf = "site/config.toml";
}

const conf = "site/sinalocal.toml";

// Hugo arguments
const hugoArgsDefault = ["-d", "../dist", "-s", "site", "-v", "--config", conf];
const hugoArgsPreview = ["--buildDrafts", "--buildFuture"];

// Development tasks
gulp.task("hugo", (cb) => buildSite(cb));
gulp.task("hugo-preview", (cb) => buildSite(cb, hugoArgsPreview));

// Run server tasks
gulp.task("server", ["hugo", "css", "js", "fonts"], (cb) => runServer(cb));
gulp.task("server-preview", ["hugo-preview", "css", "js", "fonts"], (cb) => runServer(cb));

// Build/production tasks
gulp.task("build", ["css", "js", "fonts"], (cb) => buildSite(cb, [], "production"));
gulp.task("build-preview", ["css", "js", "fonts"], (cb) => buildSite(cb, hugoArgsPreview, "production"));

gulp.task("css", () => (
  gulp.src("./src/css/*.css")
    .pipe(sourcemaps.init())
    .pipe(postcss(processors))
    .pipe(nano())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest("./dist/css"))
    .pipe(browserSync.stream())
));

gulp.task('sass', () => (
  gulp.src('./src/css/site.scss')
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

gulp.task('img', () =>
  gulp.src(imgSrc)
  // .pipe(newer(imgDest))
  .pipe(imagemin(imgOpt))
  .pipe(gulp.dest(imgDest))
);

gulp.task("fonts", () => (
  gulp.src("./src/fonts/**/*")
    .pipe(flatten())
    .pipe(gulp.dest("./dist/fonts"))
    .pipe(browserSync.stream())
));

function runServer() {
  browserSync.init({
    server: {
      baseDir: "./dist"
    }
  });
  gulp.watch("./src/js/**/*.js", ["js"]);
  gulp.watch("./src/css/**/*.css", ["css"]);
  gulp.watch("./src/css/**/**/*.scss", ["sass"]);
  gulp.watch("./src/fonts/**/*", ["fonts"]);
  gulp.watch(imgSrc, ["img"]);
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