// Initialize Modules
const { src, dest, watch, series, parallel } = require('gulp');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const concat = require('gulp-concat');
const postcss = require('gulp-postcss');
const replace = require('gulp-replace');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const terser = require('gulp-terser');
const imagemin = require('gulp-imagemin');
const lineec = require('gulp-line-ending-corrector');
const changed = require('gulp-changed');
const htmlmin = require('gulp-htmlmin');
const del = require('del');
const browserSync = require('browser-sync').create();
reload = browserSync.reload;

// File Path Variables
const files = {
    srcDir: 'src/',
    tmpDir: 'tmp/',
    scssTmpPath: 'tmp/assets/_scss/**/*.scss',
    cssMinTmpPath: 'tmp/assets/style/',
    jsTmpPath: 'tmp/assets/_js/**/*.js',
    jsMinTmpPath: 'tmp/assets/script/',
    imgTmpPath: 'tmp/assets/img/**/*.{jpg,png,gif,svg}',
    distDir: 'dist/',
    cssDistPath: 'dist/assets/style/',
    jsDistPath: 'dist/assets/script/',
    imgDistPath: 'dist/assets/img/',
}

// Setup Task
function setupTask(){
    return src(files.srcDir + '**/*', { dot: true })
    .pipe(dest(files.tmpDir));
}

// Sass Task
function scssTask(){
    return src(files.scssTmpPath)
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(concat('style.min.css'))
    .pipe(postcss([ autoprefixer(), cssnano() ]))
    .pipe(sourcemaps.write('.'))
    .pipe(dest(files.cssMinTmpPath));
}

// CSS Migration Task
function cssSyncTask(){
    return src(files.cssMinTmpPath + '**/*')
    .pipe(dest(files.cssDistPath));
}

// JS Task
function jsTask(){
    return src(files.jsTmpPath)
    .pipe(concat('script.min.js'))
    .pipe(terser())
    .pipe(lineec())
    .pipe(dest(files.jsMinTmpPath));
}

// JS Migration Task
function jsSyncTask(){
    return src(files.jsMinTmpPath + '**/*')
    .pipe(dest(files.jsDistPath));
}

// Image Minify Task
function imgMinifyTask(){
    return src(files.imgTmpPath)
    .pipe(changed(files.imgDistPath))
    .pipe(imagemin())
    .pipe(dest(files.imgDistPath));
}

// Root Migration Task
function rootSyncTask(){
    return src([files.tmpDir + '**/*' , '!' + files.tmpDir + '**/*html' ,'!' + files.tmpDir + 'assets/**/*'], { dot: true })
    .pipe(dest(files.distDir));
}

// Watch Task
function watchTask(){
    watch(files.scssTmpPath, series(scssTask, cssSyncTask));
    watch(files.jsTmpPath, series(jsTask, jsSyncTask));
    watch(files.imgTmpPath, parallel(imgMinifyTask));
    //watch([files.tmpDir + '**/*'], { events: ['all'], ignorePermissionErrors: true } , parallel(rootSyncTask));
    browserSync.init ({
        server: {
            baseDir: './' + files.tmpDir
        }
          })
    watch(['./' + files.tmpDir + '*.html', files.scssTmpPath, files.jsTmpPath, files.imgTmpPath]).on('change', browserSync.reload);
}

// Default Task
exports.default = series(
    purgeTask,
    parallel(scssTask, jsTask, imgMinifyTask),
    parallel(cssSyncTask, jsSyncTask),
    watchTask
);

// Setup Task
exports.init = series(
    purgeTask,
    setupTask,
    parallel(scssTask, jsTask, imgMinifyTask),
    parallel(cssSyncTask, jsSyncTask),
    watchTask
);

// Purge Task (Fresh Dist)
function purgeTask(){
    return del(files.distDir, { dot: true });
}

// Cachebusting Task (For Final Build Only)
const cbstring = new Date().getTime();
function cachebustTask(){
    return src([files.tmpDir + '**/*.html'])
        .pipe(replace(/cb=\d+/g, 'cb=' + cbstring))
        .pipe(dest(files.distDir));
}

// HTML Minify Task (For Final Build Only)
function htmlMinifyTask(){
    return src(files.distDir + '**/*.html')
    .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
    .pipe(dest(files.distDir));
}

// Archive Task (For Final Build Only)
function archiveTask(){
    return src(files.distDir + '**/*', { dot: true })
    .pipe(dest('_archive/' + 'dist_' + cbstring));
}

// Final Build Creation (For Final Build Only)
exports.build = series(
    rootSyncTask,
    cachebustTask,
    htmlMinifyTask,
    archiveTask
);