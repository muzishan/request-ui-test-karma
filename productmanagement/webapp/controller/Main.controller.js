sap.ui.define([
    "com/kion/sdr/ui/productmanagement/controller/Base.controller",
    "com/kion/sdr/ui/productmanagement/utils/AjaxHelper",
    "com/kion/sdr/ui/productmanagement/utils/Formatter",
    "com/kion/sdr/ui/productmanagement/utils/DialogHelper",
    "sap/ui/model/json/JSONModel",
    "com/kion/sdr/ui/productmanagement/utils/CRUDHelper",
    "com/kion/sdr/ui/productmanagement/utils/Validator",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/export/library",
    "sap/ui/export/Spreadsheet"
],
function (Controller, AjaxHelper, Formatter, DialogHelper, JSONModel, CRUDHelper, Validator, MessageBox, MessageToast, ExportLibrary, Spreadsheet ) {
    "use strict";
    const EdmType = ExportLibrary.EdmType;
    return Controller.extend("com.kion.sdr.ui.productmanagement.controller.Main", {
        formatter: Formatter,
        onInit: function () {
            this.initMessaging();
            AjaxHelper.initInterceptor();
            this.oTable = this.byId("tableProducts");
            const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("RouteMain").attachPatternMatched(this.onObjectMatched, this);
        },
        onObjectMatched: async function () {
            const currentUser = await AjaxHelper.getCurrentUser(this);
            let isAdmin = false;
            if (currentUser.roles.some((role) => role.includes("SDR_Admins"))) {
                isAdmin = true;
            }
            this.getView().setModel(new JSONModel({ isAdmin }), "currentUserModel");
        },
        onPressCreateButton: function (oEvent) {
            this.removeAllMessages();
            const product = {
                series: '',
                seriesDescription: '',
                productCode: '',
                description: '',
                brand: 'LMH',
                active: true
            };
            this.initProductAddModel(product);
            DialogHelper.initProductAddDialog(this);
        },
        initProductAddModel: function (product) {
            const productCreateModel = this.getView().getModel("productCreateModel");
            if (!productCreateModel) {
                this.getView().setModel(new JSONModel(product), "productCreateModel");
            } else {
                productCreateModel.setData(product);
            }
        },
        onProductDialogSavePress: function (oEvent) {
            this.removeAllMessages();
            const oDataModel = this.getView().getModel("productCreateModel");
            const hasError = Validator.validateCreateProduct(this, ['seriesDialogInput', 'seriesDescDialogInput', 'productCodeDialogInput', 'productDescDialogInput']);

            if (!hasError) {
                const oData = oDataModel.getData();
                if (oData.isEdit) {
                    CRUDHelper.updateProductContext(this, oData);
                } else {
                    CRUDHelper.createProductContext(this, oData);
                }
            }
        },
        onProductDialogClosePress: function (oEvent) {
            this.removeAllMessages();
            oEvent.getSource().getParent().getParent().destroy();
            this.oTable.getBinding('items').resetChanges();
        },
        createProductCompleted: function (oEvent) {
            if (oEvent.getParameter("success")) {
                this.oProductDialog.close();
                this.onRefreshButtonPressed();
            } else {
                this.oTable.getBinding('items').resetChanges();
                this.onRefreshButtonPressed();
            }
        },
        onSelectionChange: function () {
            const oTable = this.getView().byId("tableProducts");
            const aSelectedItems = oTable.getSelectedItems();
            const oDeleteButton = this.getView().byId("deleteButton");

            oDeleteButton.setVisible(aSelectedItems.length > 0);
        },
        onPressDeleteButton: function (oEvent) {
            const oButton = oEvent.getSource();
            const oBindingContext = oButton.getBindingContext();
            const that = this;
            const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();

            const sProductCode = oBindingContext.getProperty("productCode");
            const sConfirmMessage = oResourceBundle.getText("confirmTheDeletion", [sProductCode]);

            MessageBox.confirm(sConfirmMessage, {
                icon: MessageBox.Icon.WARNING,
                title: oResourceBundle.getText("deleteConfirmTitle"),
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                onClose: function (res) {
                    if (res === MessageBox.Action.OK) {
                        CRUDHelper.deleteProductContext(that, oBindingContext);
                    }
                }
            });
        },
        onPressBulkDeleteButton: function () {
            const that = this;
            const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();

            MessageBox.confirm(oResourceBundle.getText("confirmBulkDeletion"), {
                icon: MessageBox.Icon.WARNING,
                title: oResourceBundle.getText("deleteConfirmTitle"),
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                onClose: function (res) {
                    if (res === MessageBox.Action.OK) {
                        CRUDHelper.deleteProductContext(that);
                    }
                }
            });
        },
        onRefreshButtonPressed: function () {
            const oBinding = this.oTable.getBinding("items");
            oBinding.refresh();
        },
        onPressEditButton: function (oEvent) {
            this.removeAllMessages();
            const oItemContext = oEvent.getSource().getBindingContext();
            this.editContext = oItemContext;
            const oItem = oItemContext.getObject();
            const oProductData = JSON.parse(JSON.stringify(oItem));

            oProductData.isEdit = true;
            oProductData.contextPath = oItemContext.getPath();

            this.initProductAddModel(oProductData);
            DialogHelper.initProductAddDialog(this);
        },
        onSearch: function (oEvent) {
            const oTable = this.getView().byId("tableProducts");
            const oBinding = oTable.getBinding("items");
            const aFilters = [];

            const sSeries = this.getView().byId("seriesInput").getValue().trim();
            const sSeriesDesc = this.getView().byId("seriesDescInput").getValue().trim();
            const sProductCode = this.getView().byId("productCodesInput").getValue().trim();
            const sProductDesc = this.getView().byId("productCodesDescInput").getValue().trim();
            const sBrand = this.getView().byId("brandInput").getSelectedKey();
            const sStatus = this.getView().byId("statusSelect").getSelectedKey();
            this.filterStrForExport = [];

            if (sSeries) {
                aFilters.push(new sap.ui.model.Filter({
                    path: "series",
                    operator: sap.ui.model.FilterOperator.Contains,
                    value1: sSeries,
                    caseSensitive: false
                }));
                this.filterStrForExport.push(`contains(tolower(series),tolower('${sSeries}'))`);
            }
            if (sSeriesDesc) {
                aFilters.push(new sap.ui.model.Filter({
                    path: "seriesDescription",
                    operator: sap.ui.model.FilterOperator.Contains,
                    value1: sSeriesDesc,
                    caseSensitive: false
                }));
                this.filterStrForExport.push(`contains(tolower(seriesDescription),tolower('${sSeriesDesc}'))`);
            }
            if (sProductCode) {
                aFilters.push(new sap.ui.model.Filter({
                    path: "productCode",
                    operator: sap.ui.model.FilterOperator.Contains,
                    value1: sProductCode,
                    caseSensitive: false
                }));
                this.filterStrForExport.push(`contains(tolower(productCode),tolower('${sProductCode}'))`);
            }
            if (sProductDesc) {
                aFilters.push(new sap.ui.model.Filter({
                    path: "description",
                    operator: sap.ui.model.FilterOperator.Contains,
                    value1: sProductDesc,
                    caseSensitive: false
                }));
                this.filterStrForExport.push(`contains(tolower(description),tolower('${sProductDesc}'))`);
            }
            if (sBrand) {
                aFilters.push(new sap.ui.model.Filter({
                    path: "brand",
                    operator: sap.ui.model.FilterOperator.EQ,
                    value1: sBrand
                }));
                this.filterStrForExport.push(`brand eq '${sBrand}'`);
            }
            if (sStatus) {
                const bActive = sStatus === "true";
                aFilters.push(new sap.ui.model.Filter("active", sap.ui.model.FilterOperator.EQ, bActive));
                this.filterStrForExport.push(`active eq ${bActive}`);
            }
            oBinding.filter(aFilters);

        },
        dataReceived: function() {
            const aItems = this.oTable.getItems();
            const oData = aItems.map((item) => item.getBindingContext().getObject());
            return oData;
        },
        onExcelExport: function () {
            const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            let oDataSource = [];
            AjaxHelper.fetchData(this, `ProductCodes?$top=10000&$count=true&$orderby=createdAt desc&$filter=${this.filterStrForExport.join(' and ')}`).then((products) => {
                oDataSource = products.value.map((item) => {
                    return {
                        ...item,
                        active: item.active ? oResourceBundle.getText("Active") : oResourceBundle.getText("Inactive")
                    };
                });
                const oColConfig = this.createColumnConfig();
                const oSheetConfig = {
                    workbook: {
                        columns: oColConfig,
                        context: {
                            sheetName: "Products"
                        }
                    },
                    dataSource: oDataSource,
                    fileName: "Products.xlsx"
                };
                const oSheet = new Spreadsheet(oSheetConfig);
                oSheet.build().then(function () {
                    MessageToast.show(oResourceBundle.getText("exportFinishedMessage"));
                }).finally(function () {
                    oSheet.destroy();
                });
            });
        },
        createColumnConfig: function () {
            return [{
                label: this.getView().getModel("i18n").getResourceBundle().getText("columnSeries"),
                property: "series",
                width: "20",
                type: EdmType.String
            },{
                label: this.getView().getModel("i18n").getResourceBundle().getText("columnSeriesDescription"),
                property: "seriesDescription",
                width: "20",
                type: EdmType.String
            },{
                label: this.getView().getModel("i18n").getResourceBundle().getText("columnProductCode"),
                property: "productCode",
                width: "20",
                type: EdmType.String
            }, {
                label: this.getView().getModel("i18n").getResourceBundle().getText("columnDescription"),
                property: "description",
                width: "20",
                type: EdmType.String
            }, {
                label: this.getView().getModel("i18n").getResourceBundle().getText("columnBrand"),
                property: "brand",
                width: "10",
                type: EdmType.String
            }, {
                label: this.getView().getModel("i18n").getResourceBundle().getText("columnIsActive"),
                property: "active",
                width: "10",
                type: EdmType.String
            }];
        },
        onRadioButtonSelect: function(oEvent) {
            const oSelectedIndex = oEvent.getParameter("selectedIndex");
            const bIsActive = oSelectedIndex === 0;
            this.getView().getModel("productCreateModel").setProperty("/active", bIsActive);
        },
        onReset: function () {
            this.getView().byId("seriesInput").setValue("");
            this.getView().byId("seriesDescInput").setValue("");
            this.getView().byId("productCodesInput").setValue("");
            this.getView().byId("productCodesDescInput").setValue("");


            this.getView().byId("brandInput").setSelectedKey("");
            this.getView().byId("statusSelect").setSelectedKey("");
            this.onSearch();
            this.filterStrForExport = [];
        }
    });
});
