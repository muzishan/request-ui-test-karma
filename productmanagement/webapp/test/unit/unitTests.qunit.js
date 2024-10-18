/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"com/kion/sdr/ui/productmanagement/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
