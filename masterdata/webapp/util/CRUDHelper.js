sap.ui.define(["sap/m/MessageBox"], function (MessageBox) {
    "use strict";
    return {
        createEntityContext: function (oController, sEntityType, oData) {
            const oTable = oController.getTableByEntityType(sEntityType);
            const oTableBinding = oTable.getBinding("items");
            oTableBinding.create(oData);
            oTableBinding.refresh();
        },

        updateEntityContext: function (oController, sEntityType, oData) {
            const oContext = oController.editContext;
            const promises = [];
            for (const key in oData) {
                if (Object.hasOwn(oData, key) && !['isEdit', 'contextPath', 'country', 'industryCode', 'salesOrg'].includes(key)) {
                    promises.push(new Promise((resolve, reject) => {
                        oContext.setProperty(key, oData[key]).then(
                            () => resolve(!oContext.hasPendingChanges()),
                            (oError) => reject(oError)
                        );
                    }));
                }
            }
            Promise.all(promises).then(() => {
                const oTable = oController.getTableByEntityType(sEntityType);
                oTable.getBinding("items").refresh();
            });
        },
        deleteEntityContext: function (oController, sEntityType, oContext) {
            const oResourceBundle = oController.getView().getModel("i18n").getResourceBundle();

            if (oContext) {
                oContext.delete().then(() => {
                    sap.m.MessageToast.show(oResourceBundle.getText("deleteSuccessMessage"));
                    const oTable = oController.getTableByEntityType(sEntityType);
                    oTable.getBinding("items").refresh();
                }).catch((error) => {
                    sap.m.MessageBox.error(error.message);
                });
            }
        }
    };
});