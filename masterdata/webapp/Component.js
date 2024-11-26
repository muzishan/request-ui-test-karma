/**
 * eslint-disable @sap/ui5-jsdocs/no-jsdoc
 */

sap.ui.define([
        "sap/ui/core/UIComponent",
        "sap/ui/Device",
        "com/kion/sdr/ui/masterdata/model/models"
    ],
    function (UIComponent, Device, models) {
        "use strict";

        return UIComponent.extend("com.kion.sdr.ui.masterdata.Component", {
            metadata: {
                manifest: "json"
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
                // call the base component's init function
                UIComponent.prototype.init.apply(this, arguments);

                // enable routing
                this.getRouter().initialize();

                // set the device model
                this.setModel(models.createDeviceModel(), "device");

                const jQueryScriptJszip = document.createElement('script');
                jQueryScriptJszip.setAttribute('src', 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.10.0/jszip.js');
                document.head.appendChild(jQueryScriptJszip);


                const jQueryScriptXlsx = document.createElement('script');
                jQueryScriptXlsx.setAttribute('src', 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.10.0/xlsx.js');
                document.head.appendChild(jQueryScriptXlsx);
            }
        });
    }
);