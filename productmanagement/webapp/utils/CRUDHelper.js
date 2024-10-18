sap.ui.define(["sap/m/MessageBox"], function (MessageBox) {
    "use strict";
    return {
        createProductContext: function (oController, oData) {
            const oTableBinding = oController.oTable.getBinding("items");
            oTableBinding.create(oData);
            oTableBinding.refresh();
        },
        updateProductContext: function (oController, oData) {
            const oResourceBundle = oController.getView().getModel("i18n").getResourceBundle();
            const oContext = oController.editContext;

            const promises = [];

            delete oData.isEdit;
            delete oData.contextPath;

            for (const key in oData) {
                if (Object.hasOwn(oData, key)) {
                    promises.push(new Promise((resolve, reject) => {
                        oContext.setProperty(key, oData[key]).then(
                            function () {
                                resolve(!oContext.hasPendingChanges());
                            }, function (oError) {
                                reject(oError);
                            });
                    }));
                }
            }
            Promise.all(promises).then(() => {
                sap.m.MessageToast.show(oResourceBundle.getText("productUpdateSuccess"));
            });
        },
        deleteProductContext: function (oController, oBindingContext) {
            const oDeleteButton = oController.getView().byId("deleteButton");
            const oTable = oController.getView().byId("tableProducts");
            const oResourceBundle = oController.getView().getModel("i18n").getResourceBundle();

            if (oBindingContext) {
                oBindingContext.delete().then(() => {
                    sap.m.MessageToast.show(oResourceBundle.getText("deleteProductWasSuccessful"));
                }).catch((error) => {
                    MessageBox.error(oResourceBundle.getText(error.message));
                });
            } else {
                const aSelectedItems = oTable.getSelectedItems();
                Promise.all(
                    aSelectedItems.map((oItem) => {
                        const oContext = oItem.getBindingContext();
                        return oContext.delete().catch((error) => {
                            return error;
                        });
                    })
                ).then((errors) => {
                    const hasError = errors.some((error) => error);
                    if (!hasError) {
                        sap.m.MessageToast.show(oResourceBundle.getText("deleteProductWasSuccessful"));
                        oDeleteButton.setVisible(false);
                    } else {
                        const firstError = errors.find((error) => error);
                        MessageBox.error(oResourceBundle.getText(firstError.message));
                    }
                    oTable.removeSelections();
                });
            }
        }
    };
});