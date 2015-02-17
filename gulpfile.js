var gulp         = require('gulp')
var $            = require('gulp-load-plugins')({replaceString: /^gulp(-|\.)([0-9]+)?/})
const fs         = require('fs')
const del        = require('del')
const path       = require('path')
const esperanto  = require('esperanto')
const browserify = require('browserify')
const to5ify     = require("6to5ify")
const source     = require('vinyl-source-stream')
const config     = require('./package.json').buildOpts


gulp.task('clean', function(cb) {
  del([config.destinationFolder], cb)
})

// Build two versions of the library
gulp.task('build', ['clean'], function(done) {
  esperanto.bundle({
    base: 'src',
    entry: config.entryFileName,
  }).then(function(bundle) {
    res = bundle.toUmd({
      sourceMap: true,
      sourceMapSource: config.entryFileName + '.js',
      sourceMapFile: config.exportFileName + '.js',
      name: config.exportVarName
    })

    // Write the generated sourcemap
    fs.mkdirSync(config.destinationFolder)
    fs.writeFileSync(path.join(config.destinationFolder, config.exportFileName + '.js'), res.map.toString())

    $.file(config.exportFileName + '.js', res.code, { src: true })
      .pipe($.plumber())
      .pipe($.sourcemaps.init({ loadMaps: true }))
      .pipe($.to5({ blacklist: ['useStrict'] }))
      .pipe($.sourcemaps.write('./', {addComment: false}))
      .pipe(gulp.dest(config.destinationFolder))
      .pipe($.filter(['*', '!**/*.js.map']))
      .pipe($.rename(config.exportFileName + '.min.js'))
      .pipe($.uglifyjs({
        outSourceMap: true,
        inSourceMap: config.destinationFolder + '/' + config.exportFileName + '.js.map',
      }))
      .pipe(gulp.dest(config.destinationFolder))
      .on('end', done)
  })
})

// Use 6to5 to build the library to CommonJS modules. This
// is fed to Browserify, which builds the version of the lib
// for our browser spec runner.
gulp.task('compile-browser-script', function() {
  return gulp.src(['src/**/*.js'])
    .pipe($.plumber())
    .pipe($.to5({modules: 'common'}))
    .pipe(gulp.dest('tmp'))
    .pipe($.filter([config.entryFileName + '.js']))
    .pipe($.rename('__entry.js'))
    .pipe(gulp.dest('tmp'))
})

// Bundle our app for our unit tests
gulp.task('browserify', [], function() {
  browserify({ debug: true })
   .transform(to5ify)
   .require("./src/phlux.js", { entry: true })
   .bundle()
   .on("error", function (err) { console.log("Error : " + err.message) })
   .pipe(fs.createWriteStream("bundle.js"))
})


gulp.task('test', [], function() {
  require('6to5/register')({ modules: 'common' })
  return gulp.src(['test/setup/node.js', 'test/unit/**/*.js'], {read: false})
    .pipe($.plumber())
    .pipe($.mocha({reporter: 'dot', globals: config.mochaGlobals}))
})

// Run the headless unit tests as you make changes.
gulp.task('watch', function() {
  gulp.watch(['src/**/*', 'test/**/*'], ['test'])
})

gulp.task('default', ['test'])
