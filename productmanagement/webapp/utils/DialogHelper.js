sap.ui.define([
    "sap/ui/core/Fragment"],
    function (Fragment) {
        "use strict";
        return {
            initProductAddDialog: function (oController) {
                if (oController.oProductDialog == null || oController.oProductDialog.bIsDestroyed) {
                    Fragment.load({
                        id: oController.getView().getId(),
                        name: 'com.kion.sdr.ui.productmanagement.view.fragments.AddOrEditDialog',
                        controller: oController
                    }).then(function (oDialog) {
                        oController.oProductDialog = oDialog;
                        oController.getView().addDependent(oController.oProductDialog);
                        oController.oProductDialog.open();
                    });
                } else {
                    oController.oProductDialog.open();
                }
            }
        };
    });