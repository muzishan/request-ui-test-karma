/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"com/kion/sdr/ui/masterdata/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
