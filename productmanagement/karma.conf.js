module.exports = function (config) {
    "use strict";

    config.set({
        frameworks: ["ui5"],
        plugins: [
            'karma-ui5',
            'karma-chrome-launcher',
            'karma-coverage',
			'karma-sonarqube-reporter'
        ],
        ui5: {
            type: "application",
            configPath: "ui5-karma.yaml"
        },
        browserConsoleLogOptions: {
            level: "error"
        },
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
		logLevel: config.LOG_ERROR,
        preprocessors: {
			'webapp/*.js': ['coverage'],
        	'webapp/!(test|localService|resources)/**/*.js': ['coverage']
		},
        coverageReporter: {
			includeAllSources: true,
			reporters: [
				{
					type: 'text'
				},
				{
					type: 'lcov',
					dir: './coverage/',
					subdir:'.'
				}
			],
			check: {
				each: {
					statements: 0,
					branches: 0,
					functions: 0,
					lines: 0
				}
			}
		},
		client: {
			qunit: {
				showUI: true
			}
		},
        reporters: ["progress", 'coverage', 'sonarqube'],
        browsers: ["ChromeHeadless"],
		singleRun: true
    });
	require('karma-ui5/helper').configureIframeCoverage(config)
};
