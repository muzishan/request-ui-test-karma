/*global XLSX*/
sap.ui.define([
    "com/kion/sdr/ui/masterdata/controller/Base.controller",
    "com/kion/sdr/ui/masterdata/util/AjaxHelper",
    "com/kion/sdr/ui/masterdata/util/Formatter",
    "sap/ui/model/json/JSONModel",
    "com/kion/sdr/ui/masterdata/util/DialogHelper",
    "com/kion/sdr/ui/masterdata/util/CRUDHelper",
    "com/kion/sdr/ui/masterdata/util/Validator",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/export/library",
    "sap/ui/export/Spreadsheet",
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator'
],
function (Controller, AjaxHelper, Formatter, JSONModel, DialogHelper, CRUDHelper, Validator, Fragment, MessageBox, MessageToast, ExportLibrary, Spreadsheet, Filter, FilterOperator) {
    "use strict";
    const EdmType = ExportLibrary.EdmType;
    return Controller.extend("com.kion.sdr.ui.masterdata.controller.Main", {
        formatter: Formatter,
        onInit: function () {
            this.initMessaging();
            AjaxHelper.initInterceptor();
            this.oBatteryChargerDialog = null;
            this.oSeriesDialog = null;
            this.oDiscountDialog = null;
            this.oCountryDialog = null;
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
        onTableSwitch: function (oEvent) {
            const sSelectedKey = oEvent.getParameter("key");

            const oButtonTableMap = {
                "seriesButton": "tableSeries",
                "countryButton": "tableCountry",
                "batteryAndChargerButton": "tableBatteryCharger",
                "batteryAndChargerDiscountButton": "tableBatteryChargerDiscount"
            };

            const aTableIds = ["tableSeries", "tableCountry", "tableBatteryCharger", "tableBatteryChargerDiscount"];

            const sTableToShow = oButtonTableMap[sSelectedKey];

            aTableIds.forEach(function (sTableId) {
                const oTable = this.byId(sTableId);
                if (oTable) {
                    oTable.setVisible(sTableId === sTableToShow);
                }
            }.bind(this));
        },
        onPressCreateButton: function (oEvent) {
            this.removeAllMessages();
            const sEntityType = this.getCurrentEntityType();
            const oNewEntityData = this.getNewEntityData(sEntityType);
            this.initEntityAddModel(sEntityType, oNewEntityData);
            this.openEntityDialog(sEntityType);
        },
        getCurrentEntityType: function () {
            if (this.byId("tableSeries").getVisible()) {
                return "series";
            } else if (this.byId("tableBatteryCharger").getVisible()) {
                return "batteryCharger";
            } else if (this.byId("tableBatteryChargerDiscount").getVisible()) {
                return "batteryChargerDiscount";
            } else if (this.byId("tableCountry").getVisible()) {
                return "country";
            }
            return null;
        },
        getNewEntityData: function (sEntityType) {
            switch (sEntityType) {
                case "series":
                    return { brand: 'LMH', code: '', description: '' };
                case "batteryCharger":
                    return { category: 'BATTERY', code: '', description: '', active: true };
                case "batteryChargerDiscount":
                    return { category: 'BATTERY', batteryCharger_ID: '', series_ID: null, validFrom: undefined, discount: 0.00, salesOrg_ID: '' };
                case "country":
                    return { code: '', name: '', active: true };
                default:
                    return {};
            }
        },
        initEntityAddModel: function (sEntityType, oData) {
            const sModelName = sEntityType + "CreateModel";
            const oCreateModel = this.getView().getModel(sModelName);
            if (!oCreateModel) {
                this.getView().setModel(new sap.ui.model.json.JSONModel(oData), sModelName);
            } else {
                if (sEntityType === 'batteryChargerDiscount' && oData.category) {
                    this.setFilterForBatteryCharger(oData.category);
                }
                oCreateModel.setData(oData);
            }
        },
        openEntityDialog: function (sEntityType) {
            switch (sEntityType) {
                case "series":
                    DialogHelper.initSeriesDialog(this);
                    break;
                case "batteryCharger":
                    DialogHelper.initBatteryChargerDialog(this);
                    break;
                case "batteryChargerDiscount":
                    DialogHelper.initBatteryChargerDiscountDialog(this);
                    break;
                case "country":
                    DialogHelper.initCountryDialog(this);
                    break;
                default:
            }
        },
        getValidationInputIds: function (sEntityType) {
            switch (sEntityType) {
                case "batteryCharger":
                    return ['codeBatteryChargerDialogInput', 'descriptionBatteryChargerDialogInput'];
                case "series":
                    return ['codeSeriesDialogInput', 'descriptionSeriesDialogInput'];
                case "batteryChargerDiscount":
                    return ['comboBoxBatteryCharger', 'validFromBatteryChargerDiscountInput', 'discountBatteryChargerDiscountDialogInput', 'comboBoxSalesOrg'];
                case "country":
                    return ['codeCountryDialogInput', 'nameCountryDialogInput'];
                default:
                    return [];
            }
        },
        onEntityDialogSavePress: function (oEvent) {
            this.removeAllMessages();

            const sDialogId = oEvent.getSource().getParent().getId();
            const sEntityType = this.getEntityTypeByDialogId(sDialogId);
            const sModelName = sEntityType + "CreateModel";
            const oDataModel = this.getView().getModel(sModelName);
            this.sEntityType = sEntityType;

            const aInputIds = this.getValidationInputIds(sEntityType);
            const bHasError = Validator.validateInputs(this, aInputIds);

            if (!bHasError) {
                const oData = oDataModel.getData();
                if (sEntityType === "batteryChargerDiscount") {
                    oData.discount = parseFloat(oData.discount);
                }
                if (oData.isEdit) {
                    CRUDHelper.updateEntityContext(this, sEntityType, oData);
                } else {
                    CRUDHelper.createEntityContext(this, sEntityType, oData);
                }
            }
        },
        createCompleted: function (oEvent) {
            const oTable = this.getTableByEntityType(this.sEntityType);
            if (oEvent.getParameter("success")) {
                const oDialog = this.getDialogByEntityType(this.sEntityType);
                oDialog.close();
            } else {
                oTable.getBinding('items').resetChanges();
                oTable.getBinding('items').refresh();
            }
        },
        patchCompleted: function (oEvent) {
            const oTable = this.getTableByEntityType(this.sEntityType);
            if (oEvent.getParameter("success")) {
                const oDialog = this.getDialogByEntityType(this.sEntityType);
                oDialog.close();
            } else {
                oTable.getBinding('items').resetChanges();
            }
            oTable.getBinding('items').refresh();
        },
        getEntityTypeByDialogId: function (sDialogId) {
            if (sDialogId.includes("batteryCharger")) {
                return "batteryCharger";
            } else if (sDialogId.includes("series")) {
                return "series";
            } else if (sDialogId.includes("discount")) {
                return "batteryChargerDiscount";
            } else if (sDialogId.includes("country")) {
                return "country";
            }
            return null;
        },
        getTableByEntityType: function (sEntityType) {
            switch (sEntityType) {
                case "series":
                    return this.byId("tableSeries");
                case "batteryCharger":
                    return this.byId("tableBatteryCharger");
                case "batteryChargerDiscount":
                    return this.byId("tableBatteryChargerDiscount");
                case "country":
                    return this.byId("tableCountry");
                default:
                    return null;
            }
        },
        getDialogByEntityType: function (sEntityType) {
            switch (sEntityType) {
                case "series":
                    return this.oSeriesDialog;
                case "batteryCharger":
                    return this.oBatteryChargerDialog;
                case "batteryChargerDiscount":
                    return this.oDiscountDialog;
                case "country":
                    return this.oCountryDialog;
                default:
                    return null;
            }
        },
        onPressEditButton: function (oEvent) {
            this.removeAllMessages();
            const sEntityType = this.getCurrentEntityType();
            const oButton = oEvent.getSource();
            const oItem = oButton.getParent();
            let oContext = oItem.getBindingContext();
            if (sEntityType === 'batteryChargerDiscount') {
                oContext = oItem.getParent().oBindingContexts.batteryChargerDiscountModel;
            }
            const oData = Object.assign({}, oContext.getObject());
            oData.isEdit = true;
            this.editContext = oContext;
            this.initEntityAddModel(sEntityType, oData);
            this.openEntityDialog(sEntityType);
        },
        onDialogClosePress: function (oEvent) {
            const sDialogId = oEvent.getSource().getParent().getId();
            const sEntityType = this.getEntityTypeByDialogId(sDialogId);

            const oDialog = this.getDialogByEntityType(sEntityType);
            if (oDialog) {
                oDialog.close();
            }
        },
        onPressDeleteButton: function (oEvent) {
            this.removeAllMessages();
            const sEntityType = this.getCurrentEntityType();
            const oButton = oEvent.getSource();
            let oBindingContext = oButton.getBindingContext();
            const that = this;
            const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();

            let sItemCode = "";
            let sEntityName = "";
            switch (sEntityType) {
                case "batteryCharger":
                    sItemCode = oBindingContext.getProperty("code");
                    sEntityName = oResourceBundle.getText("batteryCharger");
                    break;
                case "series":
                    sItemCode = oBindingContext.getProperty("code");
                    sEntityName = oResourceBundle.getText("series");
                    break;
                case "batteryChargerDiscount":
                    oBindingContext = oButton.getParent().getParent().oBindingContexts.batteryChargerDiscountModel;
                    sItemCode = oBindingContext.getObject().batteryCharger.code;
                    sEntityName = oResourceBundle.getText("batteryChargerDiscount");
                    break;
                case "country":
                    sItemCode = oBindingContext.getProperty("code");
                    sEntityName = oResourceBundle.getText("country");
                    break;
                default:
                    sItemCode = "";
                    sEntityName = sEntityType;
                    break;
            }

            const sConfirmMessage = oResourceBundle.getText("confirmTheDeletion", [sEntityName, sItemCode]);
            MessageBox.confirm(sConfirmMessage, {
                icon: MessageBox.Icon.WARNING,
                title: oResourceBundle.getText("deleteConfirmTitle"),
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                onClose: function (res) {
                    if (res === MessageBox.Action.OK) {
                        CRUDHelper.deleteEntityContext(that, sEntityType, oBindingContext);
                    }
                }
            });
        },
        onSearch: function (oEvent) {
            const oBatteryChargerTable = this.byId("tableBatteryCharger");
            const oSeriesTable = this.byId("tableSeries");
            const oBatteryChargerDiscountTable = this.byId("tableBatteryChargerDiscount");
            const oCountryTable = this.byId("tableCountry");
            let oTable, aFilters;

            if (oBatteryChargerTable.getVisible()) {
                oTable = oBatteryChargerTable;
                aFilters = this.batteryChargerFilters();
            } else if (oSeriesTable.getVisible()) {
                oTable = oSeriesTable;
                aFilters = this.seriesFilters();
            } else if (oBatteryChargerDiscountTable.getVisible()) {
                oTable = oBatteryChargerDiscountTable;
                aFilters = this.batteryChargerDiscountFilters();
            } else if (oCountryTable.getVisible()) {
                oTable = oCountryTable;
                aFilters = this.countryFilters();
            } else {
                return;
            }
            const oBinding = oTable.getBinding("items");
            oBinding.filter(aFilters);
        },
        batteryChargerFilters: function () {
            const aFilters = [];
            const sCategory = this.byId("categorySelect").getSelectedKey();
            const sCode = this.byId("codeInput").getValue();
            const sDescription = this.byId("descriptionInput").getValue();
            const sStatus = this.byId("statusSelect").getSelectedKey();
            if (sCategory) {
                aFilters.push(new sap.ui.model.Filter({
                    path: "category",
                    operator: sap.ui.model.FilterOperator.Contains,
                    value1: sCategory,
                    caseSensitive: false
                 }));
            }
            if (sCode) {
                aFilters.push(new sap.ui.model.Filter({
                    path: "code",
                    operator: sap.ui.model.FilterOperator.Contains,
                    value1: sCode,
                    caseSensitive: false
                }));
            }
            if (sDescription) {
                aFilters.push(new sap.ui.model.Filter({
                    path: "description",
                    operator: sap.ui.model.FilterOperator.Contains,
                    value1: sDescription,
                    caseSensitive: false
                }));
            }
            if (sStatus) {
                const bActive = sStatus === "true";
                aFilters.push(new sap.ui.model.Filter({
                    path: "active",
                    operator: sap.ui.model.FilterOperator.EQ,
                    value1: bActive,
                    caseSensitive: false
                }));
            }
            return aFilters;
        },
        seriesFilters: function () {
            const aFilters = [];
            const sBrand = this.byId("brandSeriesSelect").getSelectedKey();
            const sCode = this.byId("codeSeriesInput").getValue();
            const sDescription = this.byId("descriptionSeriesInput").getValue();
            if (sBrand) {
                aFilters.push(new sap.ui.model.Filter({
                    path: "brand",
                    operator: sap.ui.model.FilterOperator.EQ,
                    value1: sBrand,
                    caseSensitive: false
                }));
            }
            if (sCode) {
                aFilters.push(new sap.ui.model.Filter({
                    path: "code",
                    operator: sap.ui.model.FilterOperator.Contains,
                    value1: sCode,
                    caseSensitive: false
                }));
            }
            if (sDescription) {
                aFilters.push(new sap.ui.model.Filter({
                    path:"description",
                    operator: sap.ui.model.FilterOperator.Contains,
                    value1: sDescription,
                    caseSensitive: false
                }));
            }
            return aFilters;
        },
        batteryChargerDiscountFilters: function () {
            const aFilters = [];
            const sCategory = this.byId("categoryDiscountSelect").getSelectedKey();
            const sSalesOrgCodes = this.byId("salesOrgDiscountSelect").getSelectedKeys();
            const sCode = this.byId("codeDiscountInput").getValue();
            const sSeries = this.byId("seriesDiscountInput").getValue();
            const sValidFrom = this.byId("validFromInput").getValue();
            const sDiscount = this.byId("discountInput").getValue();

            if (sCategory) {
                aFilters.push(new sap.ui.model.Filter({
                    path: "category",
                    operator: sap.ui.model.FilterOperator.EQ,
                    value1: sCategory
                }));
            }
            if (sSalesOrgCodes.length > 0) {
                const filters = sSalesOrgCodes.map(function (code) {
                    return new sap.ui.model.Filter({ path: 'salesOrg/code', operator: sap.ui.model.FilterOperator.EQ, value1: code, and: false });
                });
                aFilters.push(new sap.ui.model.Filter({ filters: filters, and: false }));
            }
            if (sCode) {
                aFilters.push(new sap.ui.model.Filter({
                    path: "batteryCharger/code",
                    operator: sap.ui.model.FilterOperator.Contains,
                    value1: sCode,
                    caseSensitive: false
                }));
            }
            if (sSeries) {
                aFilters.push(new sap.ui.model.Filter({
                    path: "series/code",
                    operator: sap.ui.model.FilterOperator.Contains,
                    value1: sSeries,
                    caseSensitive: false
                }));
            }
            if (sValidFrom) {
                const validFromDate = new Date(sValidFrom);
                const formattedDate = `${validFromDate.getFullYear()}-${String(validFromDate.getMonth() + 1).padStart(2, '0')}-${String(validFromDate.getDate()).padStart(2, '0')}`;
                aFilters.push(new sap.ui.model.Filter({
                    path: 'validFrom',
                    operator: sap.ui.model.FilterOperator.LE,
                    value1: formattedDate
                }));
            }
            if (sDiscount) {
                aFilters.push(new sap.ui.model.Filter({
                    path: "discount",
                    operator: sap.ui.model.FilterOperator.GE,
                    value1: parseFloat(sDiscount)
                }));
            }
            return aFilters;
        },
        countryFilters: function () {
            const aFilters = [];
            const sCode = this.byId("codeCountryInput").getValue();
            const sName = this.byId("nameCountryInput").getValue();
            const sStatus = this.byId("statusCountrySelect").getSelectedKey();

            if (sCode) {
                aFilters.push(new sap.ui.model.Filter({
                    path: "code",
                    operator: sap.ui.model.FilterOperator.Contains,
                    value1: sCode,
                    caseSensitive: false
                }));
            }
            if (sName) {
                aFilters.push(new sap.ui.model.Filter({
                    path: "name",
                    operator: sap.ui.model.FilterOperator.Contains,
                    value1: sName,
                    caseSensitive: false
                }));
            }
            if (sStatus) {
                const bActive = sStatus === "true";
                aFilters.push(new sap.ui.model.Filter({
                    path: "active",
                    operator: sap.ui.model.FilterOperator.EQ,
                    value1: bActive,
                    caseSensitive: false
                }));
            }
            return aFilters;
        },
        onClearFilters: function () {
            //BatteryChargerManagement
            this.getView().byId("categorySelect").setSelectedKey("");
            this.getView().byId("statusSelect").setSelectedKey("");
            this.getView().byId("codeInput").setValue("");
            this.getView().byId("descriptionInput").setValue("");
            //Series
            this.getView().byId("brandSeriesSelect").setSelectedKey("");
            this.getView().byId("codeSeriesInput").setValue("");
            this.getView().byId("descriptionSeriesInput").setValue("");
            this.onSearch();
            //BatteryChargerDiscount
            this.getView().byId("categoryDiscountSelect").setSelectedKey("");
            this.getView().byId("salesOrgDiscountSelect").removeAllSelectedItems();
            this.getView().byId("codeDiscountInput").setValue("");
            this.getView().byId("seriesDiscountInput").setValue("");
            this.getView().byId("validFromInput").setValue("");
            this.getView().byId("discountInput").setValue("");
            //Country
            this.getView().byId("statusCountrySelect").setSelectedKey("");
            this.getView().byId("codeCountryInput").setValue("");
            this.getView().byId("nameCountryInput").setValue("");
            this.onSearch();
        },
        onRadioButtonSelect: function (oEvent) {
            const oRadioButtonGroup = oEvent.getSource();
            const sGroupId = oRadioButtonGroup.getId();
            const iSelectedIndex = oRadioButtonGroup.getSelectedIndex();
            let oModel;
            let sPropertyPath;
            let sValue;
            if (sGroupId.includes("isActiveBatteryChargerDialogCheckbox")) {
                oModel = this.getView().getModel("batteryChargerCreateModel");
                sPropertyPath = "/active";
                sValue = iSelectedIndex === 0;
            } else if (sGroupId.includes("categoryBatteryChargerDialogCheckbox")) {
                oModel = this.getView().getModel("batteryChargerCreateModel");
                sPropertyPath = "/category";
                sValue = iSelectedIndex === 0 ? "BATTERY" : "CHARGER";
            } else if (sGroupId.includes("brandSeriesDialogCheckbox")) {
                oModel = this.getView().getModel("seriesCreateModel");
                sPropertyPath = "/brand";
                sValue = iSelectedIndex === 0 ? "LMH" : "STILL";
            } else if (sGroupId.includes("categoryBatteryChargerDiscountDialogCheckbox")) {
                oModel = this.getView().getModel("batteryChargerDiscountCreateModel");
                sPropertyPath = "/category";
                sValue = iSelectedIndex === 0 ? "BATTERY" : "CHARGER";
                this.setFilterForBatteryCharger(sValue);
            } else if (sGroupId.includes("isActiveCountryDialogCheckbox")) {
                oModel = this.getView().getModel("countryCreateModel");
                sPropertyPath = "/active";
                sValue = iSelectedIndex === 0;
            } else {
                return;
            }
            oModel.setProperty(sPropertyPath, sValue);
        },
        setFilterForBatteryCharger: function (category) {
            this.getView().byId("comboBoxBatteryCharger").getBinding('items').filter([
                new Filter({
                    path: 'category',
                    operator: FilterOperator.EQ,
                    value1: category
                })
            ]);
        },
        onRefreshButtonPressed: function () {
            const oBatteryChargerTable = this.byId("tableBatteryCharger");
            const oSeriesTable = this.byId("tableSeries");
            const oBatteryChargerDiscountTable = this.byId("tableBatteryChargerDiscount");
            const oCountryTable = this.byId("tableCountry");

            if (oBatteryChargerTable.getVisible()) {
                const oBinding = oBatteryChargerTable.getBinding("items");
                if (oBinding) {
                    oBinding.refresh();
                }
            } else if (oSeriesTable.getVisible()) {
                const oBinding = oSeriesTable.getBinding("items");
                if (oBinding) {
                    oBinding.refresh();
                }
            } else if (oBatteryChargerDiscountTable.getVisible()) {
                const oBinding = oBatteryChargerDiscountTable.getBinding("items");
                if (oBinding) {
                    oBinding.refresh();
                }
            } else if (oCountryTable.getVisible()) {
                const oBinding = oCountryTable.getBinding("items");
                if (oBinding) {
                    oBinding.refresh();
                }
            }
        },
        onPressImportButton: function (oEvent) {
            DialogHelper.initUploaderDialog(this);
            if (!this.oFileUploader) {
                this.oFileUploader = this.byId("fileUploader");
            }
        },
        downloadBatteryChargerDiscountUploadTemplate: function () {
            const rootPath = this.getView().getModel('oFileModel').getProperty('/path');
            AjaxHelper.downloadFile(`${rootPath}/template/Battery_Charger_Discount_Template.xlsx`, 'Battery_Charger_Discount_Template.xlsx');
        },

        handleUploaderValueChange: function (e) {
            const file = e.getParameter('files')[0]; // get the file from the FileUploader control
            const that = this;
            this.getView().byId('resultPanel').setVisible(false);
            const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            if (file && window.FileReader) {
                const reader = new window.FileReader();
                reader.onload = function (e) {
                    const data = e.target.result;
                    const excelsheet = XLSX.read(data, {
                        type: "binary"
                    });
                    excelsheet.SheetNames.forEach(function (sheetName) {
                        const excelRow = XLSX.utils.sheet_to_row_object_array(excelsheet.Sheets[sheetName]);
                        that.uploadJson = Validator.formatUploadData(excelRow);
                        if (that.uploadJson !== null) {
                            that.getView().byId('upload').setEnabled(true);
                        } else {
                            MessageBox.error(oResourceBundle.getText("plsCheckYourDataInExcelFile"), {
                                icon: MessageBox.Icon.ERROR,
                                title: oResourceBundle.getText("errorOcurredDuringExcelReading"),
                                actions: MessageBox.Action.CANCEL
                            });
                        }
                    });
                };
                reader.readAsBinaryString(file);
            }
        },

        doUploadBatteryChargerDiscount: async function () {
            const result = await AjaxHelper.uploadBatteryChargerDiscounts(this, this.uploadJson);
            const errorDetails = [];
            for (const row of result.errorDetails) {
                errorDetails.push(
                    {
                        target: 'Row ' +  row.rowNum,
                        message: row.errorMessages.join('\n')
                    }
                );
            }
            result.errorDetails = errorDetails;
            this.initUploadResultModel(result);
            this.oUploaderDialog.setBusy(false);
            this.getView().byId('resultPanel').setVisible(true);
        },

        initUploadResultModel: function (result) {
            const uploadResultModel = this.getView().getModel("uploadResultModel");
            if (!uploadResultModel) {
                this.getView().setModel(new JSONModel(result), "uploadResultModel");
            } else {
                uploadResultModel.setData(result);
            }
        },

        closeUploadDialog: function () {
            this.oFileUploader.clear();
            this.getView().byId('upload').setEnabled(false);
            this.getView().byId('resultPanel').setVisible(false);
            this.oUploaderDialog.close();
        },
        dataReceived: function() {
            const aItems = this.byId('tableBatteryChargerDiscount').getItems();
            const oData = aItems.map((item) => item.oBindingContexts.batteryChargerDiscountModel.getObject());
            return oData;
        },
        onPressExportButton: function () {
            const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            let oDataSource = [];
            oDataSource = this.dataReceived();
            const oColConfig = this.createColumnConfig();
            const oSheetConfig = {
                workbook: {
                    columns: oColConfig,
                    context: {
                        sheetName: "BatteryChargerDiscount"
                    }
                },
                dataSource: oDataSource,
                fileName: "Battery Charger Discount.xlsx"
            };
            const oSheet = new Spreadsheet(oSheetConfig);
            oSheet.build().then(function () {
                MessageToast.show(oResourceBundle.getText("exportFinishedMessage"));
            }).finally(function () {
                oSheet.destroy();
            });
        },
        createColumnConfig: function () {
            return [{
                label: this.getView().getModel("i18n").getResourceBundle().getText("category"),
                property: "category",
                width: "20",
                type: EdmType.String
            },
            {
                label: this.getView().getModel("i18n").getResourceBundle().getText("code"),
                property: "batteryCharger/code",
                width: "20",
                type: EdmType.String
            },
            {
                label: this.getView().getModel("i18n").getResourceBundle().getText("seriesColumn"),
                property: "series/code",
                width: "20",
                type: EdmType.String
            },
            {
                label: this.getView().getModel("i18n").getResourceBundle().getText("seriesDescriptionColumn"),
                property: "series/description",
                width: "20",
                type: EdmType.String
            },
            {
                label: this.getView().getModel("i18n").getResourceBundle().getText("validFromColumn"),
                property: "validFrom",
                width: "20",
                type: EdmType.String
            },{
                label: this.getView().getModel("i18n").getResourceBundle().getText("discount"),
                property: "discount",
                width: "10",
                type: EdmType.Number
            }, {
                label: this.getView().getModel("i18n").getResourceBundle().getText("salesOrgColumn"),
                property: "salesOrg/code",
                type: EdmType.String,
                width: "10"
            }];
        }
    });
});
