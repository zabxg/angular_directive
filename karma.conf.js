module.exports = function (config) {
    config.set({
        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',
        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine'],
        // list of files / patterns to load in the browser
        files: [
            'node_modules/lodash/index.js',
            'node_modules/jquery/dist/jquery.js',
            'node_modules/sinon/pkg/sinon.js',
            "node_modules/angular/angular.js",
            "node_modules/angular-mocks/angular-mocks.js",
            "src/index.js",
            'src/**/*.js',
            'test/**/*.js',
            'src/**/*.html',
            {
                pattern: 'src/**/*.json',
                included: false,
                watched: false,
                nocache: true
            },
            {
                pattern: 'test/**/*.json',
                included: false,
                watched: false,
                nocache: true
            }
        ],
        plugins: [
            'karma-jasmine',
            // 'karma-chrome-launcher',
            "karma-jasmine-html-reporter"
        ],

        // list of files / patterns to exclude
        exclude: [],
        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {},
        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['kjhtml'],
        // web server port
        port: 7357,
        // enable / disable colors in the output (reporters and logs)
        colors: true,
        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,
        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,
        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: [],
        // browsers: ['Chrome'],
        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false,
        // Concurrency level
        // how many browser should be started simultaneous
        concurrency: Infinity
    });
}