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
            this.oCustomerDialog = null;
            const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("RouteMain").attachPatternMatched(this.onObjectMatched, this);
        },
        onObjectMatched: async function () {
            this.currentUser = await AjaxHelper.getCurrentUser(this);
            let isAdmin = false;
            if (this.currentUser.roles.some((role) => role.includes("SDR_Admins"))) {
                isAdmin = true;
            }
            this.getView().setModel(new JSONModel({ isAdmin }), "currentUserModel");
            this.setInitialFilterForSalesOrgCombox();
        },
        setInitialFilterForSalesOrgCombox: function () {
            const filters = [];
            if (this.currentUser.salesOfficeBranches.length > 0) {
                for (const salesOfficeBranch of this.currentUser.salesOfficeBranches) {
                  filters.push(
                      new sap.ui.model.Filter({
                          path: 'salesOffices',
                          operator: sap.ui.model.FilterOperator.Any,
                          variable: 'item',
                          condition: new sap.ui.model.Filter({
                              path: 'item/branch',
                              operator: sap.ui.model.FilterOperator.EQ,
                              value1: salesOfficeBranch
                          }),
                          and: false
                      })
                  );
                }
                this.byId("salesOrgCustomerSelect").getBinding("items").filter(new sap.ui.model.Filter({ filters: filters, and: false }));
            }
            this.initialSalesOrgFilterForCustomer = filters;
        },
        onTableSwitch: function (oEvent) {
            const sSelectedKey = oEvent.getParameter("key");

            const oButtonTableMap = {
                "seriesButton": "tableSeries",
                "countryButton": "tableCountry",
                "batteryAndChargerButton": "tableBatteryCharger",
                "batteryAndChargerDiscountButton": "tableBatteryChargerDiscount",
                "customerButton": "tableCustomer"
            };

            const aTableIds = ["tableSeries", "tableCountry", "tableBatteryCharger", "tableBatteryChargerDiscount", "tableCustomer"];

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
            } else if (this.byId("tableCustomer").getVisible()) {
                return "customer";
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
                    return { category: 'BATTERY', batteryCharger_ID: '', series_ID: null, validFrom: undefined, discount: '0.00', salesOrg_ID: '' };
                case "country":
                    return { code: '', name: '', active: true };
                case "customer":
                    return { name1: '', name2: '', salesOrg_ID: null, customerNo: '', additionalCustomerNo: '', kionCustomerNo: '', street: '', location: '', industryCode_ID: null, postCode: '', frameContractNumber: '', country_code: ''};
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
                // refresh options of combobox after dialog open again
                if (sEntityType === 'batteryChargerDiscount') {
                    this.getView().byId("comboBoxBatteryCharger").getBinding('items').refresh();
                    this.getView().byId("comboBoxSeries").getBinding('items').refresh();
                    this.getView().byId("comboBoxSalesOrg").getBinding('items').refresh();
                } else if (sEntityType === 'customer') {
                    this.getView().byId("comboBoxCountryCustomerCreate").getBinding('items').refresh();
                    this.getView().byId("comboBoxIndustryCustomerCreate").getBinding('items').refresh();
                    this.getView().byId("comboBoxSalesOrgCustomerCreate").getBinding('items').refresh();
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
                case "customer":
                    DialogHelper.initCustomerDialog(this);
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
                    return ['comboBoxBatteryCharger', 'datePickerValidFromBatteryChargerDiscount', 'discountBatteryChargerDiscountDialogInput', 'comboBoxSalesOrg'];
                case "country":
                    return ['codeCountryDialogInput', 'nameCountryDialogInput'];
                case "customer":
                    return ['name1Input', 'comboBoxSalesOrgCustomerCreate'];
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
                delete oData['@$ui5.context.isTransient'];
                if (sEntityType === "batteryChargerDiscount") {
                    oData.discount = parseFloat(oData.discount);
                }
                if (oData.validFrom instanceof Date) {
                    oData.validFrom = `${oData.validFrom.getFullYear()}-${String(oData.validFrom.getMonth() + 1).padStart(2, '0')}-${String(oData.validFrom.getDate()).padStart(2, '0')}`;
                }
                // set to null when a property is empty string for align with import
                if (sEntityType === 'customer') {
                    for (const key in oData) {
                        oData[key] = oData[key] || null;
                    }
                }
                if (oData.isEdit) {
                    CRUDHelper.updateEntityContext(this, sEntityType, oData);
                } else {
                    CRUDHelper.createEntityContext(this, sEntityType, oData);
                }
            }
        },
        liveCheckFormValidation: function (oEvent) {
            const sEntityType = this.getCurrentEntityType();
            const aInputIds = this.getValidationInputIds(sEntityType);
            Validator.validateInputs(this, aInputIds.filter((inputId) => oEvent.getSource().sId.includes(inputId)));
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
            } else if (sDialogId.includes("customer")) {
                return "customer";
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
                case "customer":
                    return this.byId("tableCustomer");
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
                case "customer":
                    return this.oCustomerDialog;
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
            if (oData.validFrom && typeof oData.validFrom === "string") {
                oData.validFrom = new Date(oData.validFrom);
            }
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
                    sItemCode = oBindingContext.getObject().batteryCharger.code + ', validFrom:' + oBindingContext.getObject().validFrom;
                    sEntityName = oResourceBundle.getText("batteryChargerDiscount");
                    break;
                case "country":
                    sItemCode = oBindingContext.getProperty("code");
                    sEntityName = oResourceBundle.getText("country");
                    break;
                case "customer":
                    sItemCode = oBindingContext.getProperty("name1");
                    sEntityName = oResourceBundle.getText("customer");
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
            const oCustomerTable = this.byId("tableCustomer");
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
            } else if (oCustomerTable.getVisible()) {
                oTable = oCustomerTable;
                aFilters = this.customerFilters();
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
            const sValidFrom = this.byId("validFromInput").getDateValue();
            let sDiscount = this.byId("discountInput").getValue();
            this.filterStrForExportBatteryChargerDiscount = [];

            if (sCategory) {
                aFilters.push(new sap.ui.model.Filter({
                    path: "category",
                    operator: sap.ui.model.FilterOperator.EQ,
                    value1: sCategory
                }));
                this.filterStrForExportBatteryChargerDiscount.push(`category eq '${sCategory}'`);
            }
            if (sSalesOrgCodes.length > 0) {
                const filterStrArr = [];
                const filters = sSalesOrgCodes.map(function (code) {
                    filterStrArr.push(`salesOrg/code eq '${code}'`);
                    return new sap.ui.model.Filter({ path: 'salesOrg/code', operator: sap.ui.model.FilterOperator.EQ, value1: code, and: false });
                });
                aFilters.push(new sap.ui.model.Filter({ filters: filters, and: false }));
                this.filterStrForExportBatteryChargerDiscount.push(`(${filterStrArr.join(' or ')})`);
            }
            if (sCode) {
                aFilters.push(new sap.ui.model.Filter({
                    path: "batteryCharger/code",
                    operator: sap.ui.model.FilterOperator.Contains,
                    value1: sCode,
                    caseSensitive: false
                }));
                this.filterStrForExportBatteryChargerDiscount.push(`contains(tolower(batteryCharger/code),tolower('${sCode}'))`);
            }
            if (sSeries) {
                aFilters.push(new sap.ui.model.Filter({
                    path: "series/code",
                    operator: sap.ui.model.FilterOperator.Contains,
                    value1: sSeries,
                    caseSensitive: false
                }));
                this.filterStrForExportBatteryChargerDiscount.push(`contains(tolower(series/code),tolower('${sSeries}'))`);
            }
            if (sValidFrom) {
                const formattedDate = `${sValidFrom.getFullYear()}-${String(sValidFrom.getMonth() + 1).padStart(2, '0')}-${String(sValidFrom.getDate()).padStart(2, '0')}`;
                aFilters.push(new sap.ui.model.Filter({
                    path: 'validFrom',
                    operator: sap.ui.model.FilterOperator.LE,
                    value1: formattedDate
                }));
                this.filterStrForExportBatteryChargerDiscount.push(`validFrom le ${formattedDate}`);
            }
            if (sDiscount) {
                if (Formatter.checkIfUseCommaAsDecimalSeperator()){
                    sDiscount = Formatter.replaceCommaToPointAsDecimalSeperator(sDiscount);
                }
                aFilters.push(new sap.ui.model.Filter({
                    path: "discount",
                    operator: sap.ui.model.FilterOperator.EQ,
                    value1: parseFloat(sDiscount)
                }));
                this.filterStrForExportBatteryChargerDiscount.push(`discount eq ${parseFloat(sDiscount)}`);
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
        customerFilters: function (oEvent) {
            const aFilters = [];
            const sCustomerNo = this.byId("customerNoCustomerFilterInput").getValue();
            const sName1 = this.byId("name1CustomerFilterInput").getValue();
            const sName2 = this.byId("name2CustomerFilterInput").getValue();
            const sKionCustomerNo = this.byId("kionCustomerNoFilterInput").getValue();
            const sAdditionalCustomerNo = this.byId("additionalCustomerNoFilterInput").getValue();
            const sStreet = this.byId("streetFilterInput").getValue();
            const sLocation = this.byId("locationFilterInput").getValue();
            const sPostCode = this.byId("postCodeFilterInput").getValue();
            const sFrameContractNumber = this.byId("frameContractNumberFilterInput").getValue();
            const sSalesOrgs = this.byId('salesOrgCustomerSelect').getSelectedKeys();
            const sIndustryCodes = this.byId('industryCustomerSelect').getSelectedKeys();
            const sCountrys = this.byId('countryCustomerSelect').getSelectedKeys();
            this.filterStrForExportCustomer = [];

            if (sCustomerNo) {
                aFilters.push(new sap.ui.model.Filter({
                    path: "customerNo",
                    operator: sap.ui.model.FilterOperator.Contains,
                    value1: sCustomerNo,
                    caseSensitive: false
                }));
                this.filterStrForExportCustomer.push(`contains(tolower(customerNo),tolower('${sCustomerNo}'))`);
            }

            if (sName1) {
                aFilters.push(new sap.ui.model.Filter({
                    path: "name1",
                    operator: sap.ui.model.FilterOperator.Contains,
                    value1: sName1,
                    caseSensitive: false
                }));
                this.filterStrForExportCustomer.push(`contains(tolower(name1),tolower('${sName1}'))`);
            }

            if (sName2) {
                aFilters.push(new sap.ui.model.Filter({
                    path: "name2",
                    operator: sap.ui.model.FilterOperator.Contains,
                    value1: sName2,
                    caseSensitive: false
                }));
                this.filterStrForExportCustomer.push(`contains(tolower(name2),tolower('${sName2}'))`);
            }

            if (sKionCustomerNo) {
                aFilters.push(new sap.ui.model.Filter({
                    path: "kionCustomerNo",
                    operator: sap.ui.model.FilterOperator.Contains,
                    value1: sKionCustomerNo,
                    caseSensitive: false
                }));
                this.filterStrForExportCustomer.push(`contains(tolower(kionCustomerNo),tolower('${sKionCustomerNo}'))`);
            }

            if (sAdditionalCustomerNo) {
                aFilters.push(new sap.ui.model.Filter({
                    path: "additionalCustomerNo",
                    operator: sap.ui.model.FilterOperator.Contains,
                    value1: sAdditionalCustomerNo,
                    caseSensitive: false
                }));
                this.filterStrForExportCustomer.push(`contains(tolower(additionalCustomerNo),tolower('${sAdditionalCustomerNo}'))`);
            }

            if (sStreet) {
                aFilters.push(new sap.ui.model.Filter({
                    path: "street",
                    operator: sap.ui.model.FilterOperator.Contains,
                    value1: sStreet,
                    caseSensitive: false
                }));
                this.filterStrForExportCustomer.push(`contains(tolower(street),tolower('${sStreet}'))`);
            }

            if (sLocation) {
                aFilters.push(new sap.ui.model.Filter({
                    path: "location",
                    operator: sap.ui.model.FilterOperator.Contains,
                    value1: sLocation,
                    caseSensitive: false
                }));
                this.filterStrForExportCustomer.push(`contains(tolower(location),tolower('${sLocation}'))`);
            }

            if (sPostCode) {
                aFilters.push(new sap.ui.model.Filter({
                    path: "postCode",
                    operator: sap.ui.model.FilterOperator.Contains,
                    value1: sPostCode,
                    caseSensitive: false
                }));
                this.filterStrForExportCustomer.push(`contains(tolower(postCode),tolower('${sPostCode}'))`);
            }

            if (sFrameContractNumber) {
                aFilters.push(new sap.ui.model.Filter({
                    path: "frameContractNumber",
                    operator: sap.ui.model.FilterOperator.Contains,
                    value1: sFrameContractNumber,
                    caseSensitive: false
                }));
                this.filterStrForExportCustomer.push(`contains(tolower(frameContractNumber),tolower('${sFrameContractNumber}'))`);
            }

            if (sSalesOrgs.length > 0) {
                const filterStrArr = [];
                const filters = sSalesOrgs.map(function (ID) {
                    filterStrArr.push(`salesOrg_ID eq ${ID}`);
                    return new sap.ui.model.Filter({ path: 'salesOrg_ID', operator: sap.ui.model.FilterOperator.EQ, value1: ID, and: false });
                });
                aFilters.push(new sap.ui.model.Filter({ filters: filters, and: false }));
                this.filterStrForExportCustomer.push(`(${filterStrArr.join(' or ')})`);
            }

            if (sIndustryCodes.length > 0) {
                const filterStrArr = [];
                const filters = sIndustryCodes.map(function (ID) {
                    filterStrArr.push(`industryCode_ID eq ${ID}`);
                    return new sap.ui.model.Filter({ path: 'industryCode_ID', operator: sap.ui.model.FilterOperator.EQ, value1: ID, and: false });
                });
                aFilters.push(new sap.ui.model.Filter({ filters: filters, and: false }));
                this.filterStrForExportCustomer.push(`(${filterStrArr.join(' or ')})`);
            }

            if (sCountrys.length > 0) {
                const filterStrArr = [];
                const filters = sCountrys.map(function (code) {
                    filterStrArr.push(`country_code eq ${code}`);
                    return new sap.ui.model.Filter({ path: 'country_code', operator: sap.ui.model.FilterOperator.EQ, value1: code, and: false });
                });
                aFilters.push(new sap.ui.model.Filter({ filters: filters, and: false }));
                this.filterStrForExportCustomer.push(`(${filterStrArr.join(' or ')})`);
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
            //BatteryChargerDiscount
            this.getView().byId("categoryDiscountSelect").setSelectedKey("");
            this.getView().byId("salesOrgDiscountSelect").removeAllSelectedItems();
            this.getView().byId("codeDiscountInput").setValue("");
            this.getView().byId("seriesDiscountInput").setValue("");
            this.getView().byId("validFromInput").setValue("");
            this.getView().byId("discountInput").setValue("");
            this.filterStrForExportBatteryChargerDiscount = [];
            //Country
            this.getView().byId("statusCountrySelect").setSelectedKey("");
            this.getView().byId("codeCountryInput").setValue("");
            this.getView().byId("nameCountryInput").setValue("");
            // Customer
            this.getView().byId("customerNoCustomerFilterInput").setValue("");
            this.getView().byId("name1CustomerFilterInput").setValue("");
            this.getView().byId("name2CustomerFilterInput").setValue("");
            this.getView().byId("kionCustomerNoFilterInput").setValue("");
            this.getView().byId("additionalCustomerNoFilterInput").setValue("");
            this.getView().byId("streetFilterInput").setValue("");
            this.getView().byId("locationFilterInput").setValue("");
            this.getView().byId("postCodeFilterInput").setValue("");
            this.getView().byId("frameContractNumberFilterInput").setValue("");
            this.getView().byId("salesOrgCustomerSelect").removeAllSelectedItems("");
            this.getView().byId("industryCustomerSelect").removeAllSelectedItems("");
            this.getView().byId("countryCustomerSelect").removeAllSelectedItems("");
            this.filterStrForExportCustomer = [];

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
                }),
                new Filter({
                    path: 'active',
                    operator: FilterOperator.EQ,
                    value1: true
                })
            ]);
        },
        onRefreshButtonPressed: function () {
            const oBatteryChargerTable = this.byId("tableBatteryCharger");
            const oSeriesTable = this.byId("tableSeries");
            const oBatteryChargerDiscountTable = this.byId("tableBatteryChargerDiscount");
            const oCountryTable = this.byId("tableCountry");
            const oCustomerTable = this.byId("tableCustomer");

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
            } else if (oCustomerTable.getVisible()) {
                const oBinding = oCustomerTable.getBinding("items");
                if (oBinding) {
                    oBinding.refresh();
                }
            }
        },
        onPressImportButton: function (oEvent) {
            this.uploadTarget = this.getCurrentEntityType();
            this.getView().setModel(new JSONModel({uploadTarget: this.uploadTarget}), 'uploadModel');
            DialogHelper.initUploaderDialog(this);
            if (!this.oFileUploader) {
                this.oFileUploader = this.byId("fileUploader");
            }
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
                        that.uploadJson = Validator.formatUploadData(excelRow, that.uploadTarget);
                        if (typeof that.uploadJson !== 'string') {
                            that.getView().byId('upload').setEnabled(true);
                        } else {
                            MessageBox.error(oResourceBundle.getText("plsCheckYourDataInExcelFile", [that.uploadJson]), {
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

        doUpload: async function (oEvent) {
            let result;
            if (this.uploadTarget === 'batteryChargerDiscount') {
                result = await AjaxHelper.uploadBatteryChargerDiscounts(this, this.uploadJson);
                this.getView().byId("tableBatteryChargerDiscount").getBinding('items').refresh();
            } else if (this.uploadTarget === 'customer') {
                result = await AjaxHelper.uploadCustomers(this, this.uploadJson);
                this.getView().byId("tableCustomer").getBinding('items').refresh();
            }
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
            this.byId('errorErrorDetail').setVisible(errorDetails.length > 0);
            this.byId('errorList').setVisible(errorDetails.length > 0);
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
        fetchDownloadBatteryChargerDiscountData: function (url) {
            const that = this;
            AjaxHelper.fetchData(this, "/v4/batteryChargerDiscounts-service/" + url).then((res) => {
                that.oBatteryChargerDiscountDownloadDataSource = that.oBatteryChargerDiscountDownloadDataSource.concat(res.value);
                if (res['@nextLink']) {
                    that.fetchDownloadBatteryChargerDiscountData(res['@nextLink']);
                } else {
                    that.downloadExcelForBatteryChargerDiscount('Battery Charger Discount');
                }
            });
        },
        downloadExcelForBatteryChargerDiscount: function (fileName) {
            const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            const oColConfig = this.createBatteryChargerDiscountColumnConfig();
            const oSheetConfig = {
                workbook: {
                    columns: oColConfig,
                    context: {
                        sheetName: "BatteryChargerDiscount"
                    }
                },
                dataSource: this.oBatteryChargerDiscountDownloadDataSource,
                fileName: `${fileName}.xlsx`
            };
            const oSheet = new Spreadsheet(oSheetConfig);
            oSheet.build().then(function () {
                MessageToast.show(oResourceBundle.getText("exportFinishedMessage"));
            }).finally(function () {
                oSheet.destroy();
            });
        },
        onPressBatteryChargerDiscountExportButton: function () {
            this.oBatteryChargerDiscountDownloadDataSource = [];
            const filterStr = this.filterStrForExportBatteryChargerDiscount && this.filterStrForExportBatteryChargerDiscount.length > 0 ? `&$filter=${encodeURIComponent(this.filterStrForExportBatteryChargerDiscount.join(' and '))}` : '';
            this.fetchDownloadBatteryChargerDiscountData(`BatteryChargerDiscounts?$top=1000&$count=true&$expand=batteryCharger,series,salesOrg&$orderby=category,batteryCharger/code,series/code,validFrom desc,salesOrg/code${filterStr}`);
        },
        createBatteryChargerDiscountColumnConfig: function () {
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
                label: this.getView().getModel("i18n").getResourceBundle().getText("description"),
                property: "batteryCharger/description",
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
                width: "20",
                type: EdmType.Number,
                scale: 2,
                delimiter: true
            },{
                label: this.getView().getModel("i18n").getResourceBundle().getText("salesOrgColumn"),
                property: "salesOrg/code",
                type: EdmType.String,
                width: "20"
            },{
                label: this.getView().getModel("i18n").getResourceBundle().getText("salesOrgDescription"),
                property: "salesOrg/description",
                type: EdmType.String,
                width: "20"
            }];
        },
        fetchDownloadCustomerData: function (url) {
            const that = this;
            const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            const countries =  this.getCountries();
            AjaxHelper.fetchData(this, "/v4/master-data-service/" + url).then((res) => {
                that.oCustomerDownloadDataSource = that.oCustomerDownloadDataSource.concat(res.value.map(
                    (item) => {
return {
                        ...item,
                        countryName: countries.find((country) => country.code === item.country_code)?.name
                    };
}
                ));
                if (res['@nextLink']) {
                    that.fetchDownloadCustomerData(res['@nextLink']);
                } else {
                    const oColConfig = that.createCustomerColumnConfig();
                    const oSheetConfig = {
                        workbook: {
                            columns: oColConfig,
                            context: {
                                sheetName: "Customers"
                            }
                        },
                        dataSource: that.oCustomerDownloadDataSource,
                        fileName: "Customers.xlsx"
                    };
                    const oSheet = new Spreadsheet(oSheetConfig);
                    oSheet.build().then(function () {
                        MessageToast.show(oResourceBundle.getText("exportFinishedMessage"));
                    }).finally(function () {
                        oSheet.destroy();
                    });
                }
            });
        },
        onPressCustomerExportButton: function () {
            this.oCustomerDownloadDataSource = [];
            const filterStr = this.filterStrForExportCustomer && this.filterStrForExportCustomer.length > 0 ? `&$filter=${encodeURIComponent(this.filterStrForExportCustomer.join(' and '))}` : '';
            this.fetchDownloadCustomerData(`Customers?$top=1000&$count=true&$expand=salesOrg,industryCode,country&$orderby=customerNo,name1${filterStr}`);
        },
        createCustomerColumnConfig: function () {
            return [{
                label: this.getView().getModel("i18n").getResourceBundle().getText("customerNo"),
                property: "customerNo",
                width: "20",
                type: EdmType.String
            },{
                label: this.getView().getModel("i18n").getResourceBundle().getText("additionalCustomerNo"),
                property: "additionalCustomerNo",
                width: "20",
                type: EdmType.String
            },{
                label: this.getView().getModel("i18n").getResourceBundle().getText("name1"),
                property: "name1",
                width: "20",
                type: EdmType.String
            },{
                label: this.getView().getModel("i18n").getResourceBundle().getText("name2"),
                property: "name2",
                width: "20",
                type: EdmType.String
            },{
                label: this.getView().getModel("i18n").getResourceBundle().getText("street"),
                property: "street",
                width: "20",
                type: EdmType.String
            },{
                label: this.getView().getModel("i18n").getResourceBundle().getText("postCode"),
                property: "postCode",
                width: "20",
                type: EdmType.String
            },{
                label: this.getView().getModel("i18n").getResourceBundle().getText("location"),
                property: "location",
                width: "20",
                type: EdmType.String
            },{
                label: this.getView().getModel("i18n").getResourceBundle().getText("country"),
                property: "country_code",
                type: EdmType.String,
                width: "20"
            },{
                label: this.getView().getModel("i18n").getResourceBundle().getText("countryName"),
                property: "countryName",
                type: EdmType.String,
                width: "20"
            },{
                label: this.getView().getModel("i18n").getResourceBundle().getText("industry"),
                property: "industryCode/code",
                type: EdmType.String,
                width: "20"
            },{
                label: this.getView().getModel("i18n").getResourceBundle().getText("industryCodeDescription"),
                property: "industryCode/description",
                type: EdmType.String,
                width: "20"
            },{
                label: this.getView().getModel("i18n").getResourceBundle().getText("salesOrg"),
                property: "salesOrg/code",
                type: EdmType.String,
                width: "10"
            },{
                label: this.getView().getModel("i18n").getResourceBundle().getText("salesOrgDescription"),
                property: "salesOrg/description",
                type: EdmType.String,
                width: "20"
            },{
                label: this.getView().getModel("i18n").getResourceBundle().getText("frameContractNumber"),
                property: "frameContractNumber",
                width: "20",
                type: EdmType.String
            },{
                label: this.getView().getModel("i18n").getResourceBundle().getText("kionCustomerNo"),
                property: "kionCustomerNo",
                width: "20",
                type: EdmType.String
            }];
        }
    });
});
