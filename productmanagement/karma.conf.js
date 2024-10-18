module.exports = function (config) {
    "use strict";

    config.set({
        frameworks: ["ui5"],
        plugins: [
            'karma-ui5',
            'karma-firefox-launcher',
            'karma-coverage'
        ],
        ui5: {
            type: "application",
            configPath: "ui5-karma.yaml"
        },
        browserConsoleLogOptions: {
            level: "debug"
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
					type: 'html',
					dir: './coverage/'
				},
				{
					type: 'text'
				}
			],
			check: {
				each: {
					statements: 80,
					branches: 0,
					functions: 80,
					lines: 80
				}
			}
		},
		client: {
			qunit: {
				showUI: true
			}
		},
        reporters: ["progress", 'coverage'],
        browsers: ["FirefoxHeadless"],
		singleRun: true
    });
	require('karma-ui5/helper').configureIframeCoverage(config)
};
