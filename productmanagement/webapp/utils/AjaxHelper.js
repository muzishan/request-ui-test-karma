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

        formatURLForBASOrLaunchpad: function (oController, sUrl) {
            const sModelServiceUrl = oController.getView().getModel().sServiceUrl;
            const sUrlFlp = sModelServiceUrl + sUrl.replace("/", "");
            return sUrlFlp;
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