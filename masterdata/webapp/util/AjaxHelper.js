sap.ui.define([
    "sap/m/MessageBox",
    "sap/ui/core/BusyIndicator"
], function (MessageBox, BusyIndicator) {
    "use strict";
    return {
        initInterceptor: function () {
            $(document).ajaxStart(function(){
                 BusyIndicator.show(0);
            });
            $(document).ajaxComplete(function() {
                 BusyIndicator.hide();
            });
            $(document).ajaxError(function(event, xhr, options) {
                MessageBox.error(xhr.responseJSON?.error?.message);
            });
        },
        getHost: function (oController) {
            return oController.getView().getModel().sServiceUrl.split('/v4/')[0];
        },
        uploadBatteryChargerDiscounts(oController, oData) {
            const sUrl = this.getHost(oController) + "/v4/batteryChargerDiscounts-service/uploadBatteryChargerDiscounts";
            const json = JSON.stringify({batteryChargerDiscounts : oData});
            return new Promise(function (resolve, reject) {
                $.ajax({
                    async: true,
                    url: sUrl,
                    type: "POST",
                    contentType: "application/json",
                    data: json,
                    success: function (oResult) {
                        resolve(oResult);
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                });
            });
        },
        downloadFile: function (url, name){
            const a = document.createElement("a");
            a.setAttribute("href", url);
            a.setAttribute("download", name);
            a.setAttribute("target", "_blank");
            const clickEvent = document.createEvent("MouseEvents");
            clickEvent.initEvent("click", true, true);
            a.dispatchEvent(clickEvent);
        },
        getCurrentUser: function (oController) {
            const host = oController.getView().getModel().sServiceUrl.split('/v4/')[0];
            const sUrl = host + "/v4/user-service/getCurrentUser()";
            return new Promise(function (resolve, reject) {
                $.ajax({
                    url: sUrl,
                    type: "GET",
                    contentType: "application/json",
                    success: function (oResult) {
                        resolve(oResult);
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                });
            });
        }
    };
});