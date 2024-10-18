sap.ui.define([
	"com/kion/sdr/ui/productmanagement/utils/AjaxHelper",
], function (AjaxHelper) {
	"use strict";

    QUnit.module("AjaxHelper - formatURLForBASOrLaunchpad", function (hooks) {
        let oController;
        hooks.beforeEach(function () {
            oController = {
                getView: function () {
                    return {
                        getModel: function () {
                            return {
                                sServiceUrl: "https://mock-service-url.com/"
                            };
                        }
                    };
                }
            };
        });
    QUnit.test("should format URL correctly", function (assert) {
            const sUrl = "/endpoint";
            const sExpectedUrl = "https://mock-service-url.com/endpoint";

            const sFormattedUrl = AjaxHelper.formatURLForBASOrLaunchpad(oController, sUrl);
            assert.strictEqual(sFormattedUrl, sExpectedUrl, "The URL was formatted correctly for BAS or Launchpad");
        });
    });
});