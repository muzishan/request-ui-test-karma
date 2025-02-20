sap.ui.define([
    "sap/m/MessageToast",
    "sap/ui/core/BusyIndicator"
], function (MessageToast, BusyIndicator) {
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
                MessageToast.error(xhr.responseJSON?.error?.message);
            });
        },

        formatURLForBASOrLaunchpad: function (oController, sUrl) {
            const sModelServiceUrl = oController.getView().getModel().sServiceUrl;
            const sUrlFlp = sModelServiceUrl + sUrl.replace("/", "");
            return sUrlFlp;
        },
        fetchData: function (oController, sUrl) {
            sUrl = this.formatURLForBASOrLaunchpad(oController, sUrl);
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