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

    QUnit.module("AjaxHelper - fetchData", function (hooks) {
        let oController;
        
        hooks.beforeEach(function () {
            oController = {
                fetchData: AjaxHelper.fetchData,
                formatURLForBASOrLaunchpad: sinon.stub().returns("mockedUrl")
            };
        });
    
        QUnit.test("fetchData - success case", function (assert) {
            const done = assert.async();
            const sUrl = "https://mock.com/data";
            const oMockData = { data: "mockData" };
            
            const ajaxStub = sinon.stub($, "ajax").yieldsTo("success", oMockData);
    
            oController.fetchData(oController, sUrl).then(function (oResult) {
                assert.deepEqual(oResult, oMockData, "The data fetched is correct");
                done();
            });
    
            ajaxStub.restore();
        });
        QUnit.test("fetchData - error case", function (assert) {
            const done = assert.async();
            const sUrl = "https://mock.com/data";
            const oMockError = { error: "mockError" }; 
    
            const ajaxStub = sinon.stub($, "ajax").yieldsTo("error", oMockError);
    
            oController.fetchData(oController, sUrl).catch(function (oError) {
                assert.deepEqual(oError, oMockError, "The error object is correct");
                done();
            });
    
            ajaxStub.restore();
        });
    });
});