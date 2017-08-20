const gulp = require('gulp');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const path = require('path');

const minifyCss = require('gulp-minify-css');
const autoprefixer = require('gulp-autoprefixer');
const gulpScss = require('gulp-scss');

const sourceDir = {
    js: path.join(`${__dirname}/static/js/**/*.js`),
    scss: path.join(`${__dirname}/static/scss/**/*.scss`)
}

gulp.task('default', [
    'javascript',
    'scss',
    'watch',
]);

gulp.task('javascript', () => {
    gulp.src(sourceDir.js)
    .pipe(babel({
        presets: ['es2015']
    }))
    .pipe(gulp.dest(path.join(`${__dirname}/staticDest/js`)))
});

gulp.task('scss', () => {
    gulp.src(sourceDir.scss)
    .pipe(gulpScss())
    .pipe(autoprefixer({
        browsers: ['last 2 versions'],
    }))
    .pipe(minifyCss())
    .pipe(gulp.dest(path.join(`${__dirname}/staticDest/css`)))
});

gulp.task('watch', () => {
    gulp.watch(sourceDir.js, ['javascript']);
    gulp.watch(sourceDir.scss, ['scss']);
});