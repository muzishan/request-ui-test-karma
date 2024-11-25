sap.ui.define([
    "sap/ui/core/Fragment"],
    function (Fragment) {
        "use strict";
        return {
            initBatteryChargerDialog: function (oController) {
                if (oController.oBatteryChargerDialog == null || oController.oBatteryChargerDialog.bIsDestroyed) {
                    Fragment.load({
                        id: oController.getView().getId(),
                        name: 'com.kion.sdr.ui.masterdata.view.fragments.BatteryChargerAddOrEdit',
                        controller: oController
                    }).then(function (oDialog) {
                        oController.oBatteryChargerDialog = oDialog;
                        oController.getView().addDependent(oController.oBatteryChargerDialog);
                        oController.oBatteryChargerDialog.open();
                    });
                } else {
                    oController.oBatteryChargerDialog.open();
                }
            },
            initSeriesDialog: function (oController) {
                if (oController.oSeriesDialog == null || oController.oSeriesDialog.bIsDestroyed) {
                    Fragment.load({
                        id: oController.getView().getId(),
                        name: 'com.kion.sdr.ui.masterdata.view.fragments.SeriesAddOrEdit',
                        controller: oController
                    }).then(function (oDialog) {
                        oController.oSeriesDialog = oDialog;
                        oController.getView().addDependent(oController.oSeriesDialog);
                        oController.oSeriesDialog.open();
                    });
                } else {
                    oController.oSeriesDialog.open();
                }
            },
            initBatteryChargerDiscountDialog: function (oController) {
                if (oController.oDiscountDialog == null || oController.oDiscountDialog.bIsDestroyed) {
                    Fragment.load({
                        id: oController.getView().getId(),
                        name: 'com.kion.sdr.ui.masterdata.view.fragments.BatteryChargerDiscountAddOrEdit',
                        controller: oController
                    }).then(function (oDialog) {
                        oController.oDiscountDialog = oDialog;
                        oController.getView().addDependent(oController.oDiscountDialog);
                        oController.oDiscountDialog.open();
                    });
                } else {
                    oController.oDiscountDialog.open();
                }
            },
            initCountryDialog: function (oController) {
                if (oController.oCountryDialog == null || oController.oCountryDialog.bIsDestroyed) {
                    Fragment.load({
                        id: oController.getView().getId(),
                        name: 'com.kion.sdr.ui.masterdata.view.fragments.CountryAddOrEdit',
                        controller: oController
                    }).then(function (oDialog) {
                        oController.oCountryDialog = oDialog;
                        oController.getView().addDependent(oController.oCountryDialog);
                        oController.oCountryDialog.open();
                    });
                } else {
                    oController.oCountryDialog.open();
                }
            },
            initCustomerDialog: function (oController) {
                if (oController.oCustomerDialog == null || oController.oCustomerDialog.bIsDestroyed) {
                    Fragment.load({
                        id: oController.getView().getId(),
                        name: 'com.kion.sdr.ui.masterdata.view.fragments.CustomerAddOrEdit',
                        controller: oController
                    }).then(function (oDialog) {
                        oController.oCustomerDialog = oDialog;
                        oController.getView().addDependent(oController.oCustomerDialog);
                        oController.oCustomerDialog.open();
                    });
                } else {
                    oController.oCustomerDialog.open();
                }
            },
            initUploaderDialog: function (oController) {
                if (oController.oUploaderDialog == null) {
                    oController.oUploaderDialog = sap.ui.xmlfragment(oController.getView().getId(), 'com.kion.sdr.ui.masterdata.view.fragments.Uploader', oController);
                    oController.getView().addDependent(oController.oUploaderDialog);
                }
                oController.oUploaderDialog.open();
            }
        };
    });