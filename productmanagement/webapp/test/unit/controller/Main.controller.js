/*global QUnit*/

sap.ui.define([
	"com/kion/sdr/ui/productmanagement/controller/Main.controller",
	"sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "com/kion/sdr/ui/productmanagement/utils/AjaxHelper",
    "com/kion/sdr/ui/productmanagement/utils/DialogHelper",
    "com/kion/sdr/ui/productmanagement/utils/Validator",
    "com/kion/sdr/ui/productmanagement/utils/CRUDHelper",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
], function (Controller, UIComponent, JSONModel, AjaxHelper, DialogHelper, Validator, CRUDHelper, MessageBox, Filter, FilterOperator) {
	"use strict";

	QUnit.module("Main Controller", {
		beforeEach: function () {
            this.oController = new Controller();

            this.oViewStub = {
                byId: sinon.stub(),
                setModel: sinon.stub(),
                getModel: function () {}
            };
            this.getViewStub = sinon.stub(this.oController, "getView").returns(this.oViewStub);

            this.oRouterStub = {
                navTo: sinon.stub(),
                getRoute: sinon.stub().returns({
                    attachPatternMatched: sinon.stub()
                })
            };
            this.getRouterForStub = sinon.stub(UIComponent, "getRouterFor").returns(this.oRouterStub);

            this.oBindingStub = {
                refresh: sinon.stub()
            };
            this.getBindingStub = sinon.stub().returns(this.oBindingStub);

            this.oTableStub = {
                getBinding: this.getBindingStub
            };
            this.oController.oTable = this.oTableStub;
        },
        afterEach: function () {
            this.getViewStub.restore();
            this.getRouterForStub.restore();
            if (this.getModelStub && this.getModelStub.restore) {
                this.getModelStub.restore();
            }
        }
	});

	QUnit.test("Main controller should able to initialize", function (assert) {
		this.oController.onInit();
		assert.ok(this.oController);
	});

    QUnit.test("onObjectMatched should set isAdmin in the currentUserModel", async function (assert) {
        const oController = this.oController;
        const oViewStub = this.oViewStub;
    
        const currentUserMock = {
            roles: ["SDR_Admins"]
        };
    
        const getCurrentUserStub = sinon.stub(AjaxHelper, "getCurrentUser").returns(currentUserMock);
    
        await oController.onObjectMatched();
    
        assert.ok(getCurrentUserStub.calledOnce, "AjaxHelper.getCurrentUser was called once");
        assert.ok(oViewStub.setModel.calledOnce, "setModel was called once");
    
        const args = oViewStub.setModel.getCall(0).args[0].getData();
        assert.strictEqual(args.isAdmin, true, "isAdmin should be set to true in the currentUserModel");
    
        getCurrentUserStub.restore();
    });
    
    QUnit.test("onObjectMatched should not set isAdmin when the user is admin/requester/approver", async function (assert) {
        const oController = this.oController;
        const oViewStub = this.oViewStub;
    
        const currentUserMock = {
            roles: ["SDR_Viewers"]
        };
    
        const getCurrentUserStub = sinon.stub(AjaxHelper, "getCurrentUser").returns(currentUserMock);
    
        await oController.onObjectMatched();
    
        assert.ok(getCurrentUserStub.calledOnce, "AjaxHelper.getCurrentUser was called once");
        assert.ok(oViewStub.setModel.calledOnce, "setModel was called once");
    
        const args = oViewStub.setModel.getCall(0).args[0].getData();
        assert.strictEqual(args.isAdmin, false, "isAdmin should be set to false in the currentUserModel");
    
        getCurrentUserStub.restore();
    });
    
    QUnit.test("onObjectMatched should not set isAdmin when the user has no roles", async function (assert) {
        const oController = this.oController;
        const oViewStub = this.oViewStub;
    
        const currentUserMock = {
            roles: []
        };
    
        const getCurrentUserStub = sinon.stub(AjaxHelper, "getCurrentUser").returns(currentUserMock);
    
        await oController.onObjectMatched();
    
        assert.ok(getCurrentUserStub.calledOnce, "AjaxHelper.getCurrentUser was called once");
        assert.ok(oViewStub.setModel.calledOnce, "setModel was called once");
    
        const args = oViewStub.setModel.getCall(0).args[0].getData();
        assert.strictEqual(args.isAdmin, false, "isAdmin should be set to false in the currentUserModel");
    
        getCurrentUserStub.restore();
    });

    QUnit.test("onPressCreateButton - should initialize the product model and open the add dialog", function (assert) {
        const oController = this.oController;
        const initProductAddModelStub = sinon.stub(oController, "initProductAddModel");
        const initProductAddDialogStub = sinon.stub(DialogHelper, "initProductAddDialog");

        oController.onPressCreateButton();
        assert.ok(initProductAddModelStub.calledOnce, "initProductAddModel should be called once");
        const expectedProduct = {
            series: '',
            seriesDescription: '',
            productCode: '',
            description: '',
            brand: 'LMH',
            active: true
        };
        assert.deepEqual(initProductAddModelStub.firstCall.args[0], expectedProduct, "initProductAddModel called with correct product");
        assert.ok(initProductAddDialogStub.calledOnce, "DialogHelper.initProductAddDialog should be called once");
        assert.ok(initProductAddDialogStub.calledWith(oController), "DialogHelper.initProductAddDialog called with the controller instance");
        initProductAddModelStub.restore();
        initProductAddDialogStub.restore();
    });

    QUnit.test("initProductAddModel - should create a new model when productCreateModel does not exist", function (assert) {
        const oController = this.oController;
        const product = { name: "Test Product", id: 1 };

        this.getModelStub = sinon.stub(this.oViewStub, "getModel");
        this.getModelStub.withArgs("productCreateModel").returns(undefined);

        const jsonModelSpy = sinon.spy(JSONModel.prototype, "constructor");

        oController.initProductAddModel(product);
        assert.ok(this.oViewStub.setModel.calledOnce, "setModel should be called once");

        const setModelArgs = this.oViewStub.setModel.firstCall.args;
        assert.ok(setModelArgs[0] instanceof JSONModel, "First argument is an instance of JSONModel");
        assert.strictEqual(setModelArgs[1], "productCreateModel", "Model name is 'productCreateModel'");

        const jsonModelInstance = setModelArgs[0];
        assert.deepEqual(jsonModelInstance.getData(), product, "JSONModel initialized with correct product data");
        jsonModelSpy.restore();
    });

    QUnit.test("initProductAddModel - should update data when productCreateModel already exists", function (assert) {
        const oController = this.oController;
        const product = { name: "Updated Product", id: 2 };

        const existingModel = new JSONModel({ name: "Old Product", id: 1 });
        const setDataSpy = sinon.spy(existingModel, "setData");

        this.getModelStub = sinon.stub(this.oViewStub, "getModel");
        this.getModelStub.withArgs("productCreateModel").returns(existingModel);

        oController.initProductAddModel(product);
        assert.ok(setDataSpy.calledOnce, "setData should be called once on the existing model");
        assert.deepEqual(setDataSpy.firstCall.args[0], product, "setData called with the correct product data");
        assert.ok(this.oViewStub.setModel.notCalled, "setModel should not be called when model exists");
        setDataSpy.restore();
    });

    QUnit.test("onProductDialogSavePress - Should not proceed if validation errors are present", function (assert) {
        const oController = this.oController;
        const oDataModel = new JSONModel({});

        this.getModelStub = sinon.stub(this.oViewStub, "getModel");
        this.getModelStub.withArgs("productCreateModel").returns(oDataModel);

        const validateStub = sinon.stub(Validator, "validateCreateProduct").returns(true);
        const updateProductContextStub = sinon.stub(CRUDHelper, "updateProductContext");
        const createProductContextStub = sinon.stub(CRUDHelper, "createProductContext");
        const destroyStub = sinon.stub();
        const oEvent = {
            getSource: sinon.stub().returns({
                getParent: sinon.stub().returns({
                    getParent: sinon.stub().returns({
                        destroy: destroyStub
                    })
                })
            })
        };
        oController.onProductDialogSavePress(oEvent);
        assert.ok(validateStub.calledOnce, "Validator.validateCreateProduct called once");
        assert.ok(!updateProductContextStub.called, "updateProductContext should not be called");
        assert.ok(!createProductContextStub.called, "createProductContext should not be called");
        assert.ok(!destroyStub.called, "Dialog should not be destroyed");
        validateStub.restore();
        updateProductContextStub.restore();
        createProductContextStub.restore();
    });

    QUnit.test("onProductDialogSavePress - Should update product when isEdit is true", function (assert) {
        const oController = this.oController;
        const oData = { isEdit: true, name: "Test Product" };
        const oDataModel = new JSONModel(oData);

        this.getModelStub = sinon.stub(this.oViewStub, "getModel");
        this.getModelStub.withArgs("productCreateModel").returns(oDataModel);

        const validateStub = sinon.stub(Validator, "validateCreateProduct").returns(false);
        const updateProductContextStub = sinon.stub(CRUDHelper, "updateProductContext");
        const createProductContextStub = sinon.stub(CRUDHelper, "createProductContext");
        const destroyStub = sinon.stub();
        const oEvent = {
            getSource: sinon.stub().returns({
                getParent: sinon.stub().returns({
                    getParent: sinon.stub().returns({
                        destroy: destroyStub
                    })
                })
            })
        };
        oController.onProductDialogSavePress(oEvent);
        assert.ok(validateStub.calledOnce, "Validator.validateCreateProduct called once");
        assert.ok(updateProductContextStub.calledOnce, "updateProductContext should be called once");
        assert.deepEqual(updateProductContextStub.firstCall.args, [oController, oData], "updateProductContext called with correct arguments");
        assert.ok(!createProductContextStub.called, "createProductContext should not be called");
        validateStub.restore();
        updateProductContextStub.restore();
        createProductContextStub.restore();
    });

    QUnit.test("onProductDialogSavePress - Should create product when isEdit is false or undefined", function (assert) {
        const oController = this.oController;
        const oData = { name: "New Product" };
        const oDataModel = new JSONModel(oData);

        this.getModelStub = sinon.stub(this.oViewStub, "getModel");
        this.getModelStub.withArgs("productCreateModel").returns(oDataModel);

        const validateStub = sinon.stub(Validator, "validateCreateProduct").returns(false);
        const updateProductContextStub = sinon.stub(CRUDHelper, "updateProductContext");
        const createProductContextStub = sinon.stub(CRUDHelper, "createProductContext");
        const destroyStub = sinon.stub();
        const oEvent = {
            getSource: sinon.stub().returns({
                getParent: sinon.stub().returns({
                    getParent: sinon.stub().returns({
                        destroy: destroyStub
                    })
                })
            })
        };
        oController.onProductDialogSavePress(oEvent);
        assert.ok(validateStub.calledOnce, "Validator.validateCreateProduct called once");
        assert.ok(!updateProductContextStub.called, "updateProductContext should not be called");
        assert.ok(createProductContextStub.calledOnce, "createProductContext should be called once");
        assert.deepEqual(createProductContextStub.firstCall.args, [oController, oData], "createProductContext called with correct arguments");
        validateStub.restore();
        updateProductContextStub.restore();
        createProductContextStub.restore();
    });

    QUnit.test("onProductDialogClosePress - Should destroy the dialog when onProductDialogClosePress is called", function (assert) {
        const oController = this.oController;
        const destroyStub = sinon.stub();
        const oBindingStub = {
            resetChanges: sinon.stub()
        };
        this.oTableStub = {
            getBinding: sinon.stub().withArgs("items").returns(oBindingStub)
        };
        const oEvent = {
            getSource: sinon.stub().returns({
                getParent: sinon.stub().returns({
                    getParent: sinon.stub().returns({
                        destroy: destroyStub
                    })
                })
            })
        };
        this.oController.oTable = this.oTableStub;
        oController.onProductDialogClosePress(oEvent);
        assert.ok(destroyStub.calledOnce, "Dialog's destroy method should be called once");
    });

    QUnit.test("onSelectionChange - Should show the delete button when items are selected", function (assert) {
        const oController = this.oController;
        const oTableMock = {
            getSelectedItems: sinon.stub().returns([{}, {}])
        };
        const oDeleteButtonMock = {
            setVisible: sinon.stub()
        };
        this.oViewStub.byId.withArgs("tableProducts").returns(oTableMock);
        this.oViewStub.byId.withArgs("deleteButton").returns(oDeleteButtonMock);

        oController.onSelectionChange();
        assert.ok(oTableMock.getSelectedItems.calledOnce, "getSelectedItems should be called once on the table");
        assert.ok(oDeleteButtonMock.setVisible.calledOnce, "setVisible should be called once on the delete button");
        assert.ok(oDeleteButtonMock.setVisible.calledWith(true), "Delete button should be set to visible");
    });

    QUnit.test("onSelectionChange - Should hide the delete button when no items are selected", function (assert) {
        const oController = this.oController;
        const oTableMock = {
            getSelectedItems: sinon.stub().returns([])
        };
        const oDeleteButtonMock = {
            setVisible: sinon.stub()
        };
        this.oViewStub.byId.withArgs("tableProducts").returns(oTableMock);
        this.oViewStub.byId.withArgs("deleteButton").returns(oDeleteButtonMock);

        oController.onSelectionChange();
        assert.ok(oTableMock.getSelectedItems.calledOnce, "getSelectedItems should be called once on the table");
        assert.ok(oDeleteButtonMock.setVisible.calledOnce, "setVisible should be called once on the delete button");
        assert.ok(oDeleteButtonMock.setVisible.calledWith(false), "Delete button should be set to hidden");
    });
    QUnit.test("onPressDeleteButton - Should display confirmation dialog with correct message and title", function (assert) {
        const oController = this.oController;
        const oEvent = {
            getSource: sinon.stub()
        };
        const oButton = {
            getBindingContext: sinon.stub()
        };
        const oBindingContext = {
            getProperty: sinon.stub()
        };
        const sProductCode = "P123";
    
        oEvent.getSource.returns(oButton);
        oButton.getBindingContext.returns(oBindingContext);
        oBindingContext.getProperty.withArgs("productCode").returns(sProductCode);

        const oResourceBundle = {
            getText: sinon.stub()
        };
        oResourceBundle.getText.withArgs("confirmTheDeletion", [sProductCode]).returns(`Are you sure you want to delete product ${sProductCode}?`);
        oResourceBundle.getText.withArgs("deleteConfirmTitle").returns("Confirm Deletion");

        this.getModelStub = sinon.stub(this.oViewStub, "getModel");
        this.getModelStub.withArgs("i18n").returns({
            getResourceBundle: sinon.stub().returns(oResourceBundle)
        });
        const messageBoxConfirmStub = sinon.stub(MessageBox, "confirm");

        oController.onPressDeleteButton(oEvent);
        assert.ok(messageBoxConfirmStub.calledOnce, "MessageBox.confirm should be called once");

        const confirmArgs = messageBoxConfirmStub.firstCall.args;
        assert.strictEqual(confirmArgs[0], "Are you sure you want to delete product P123?", "Correct confirmation message");
        assert.strictEqual(confirmArgs[1].icon, MessageBox.Icon.WARNING, "Correct icon");
        assert.strictEqual(confirmArgs[1].title, "Confirm Deletion", "Correct title");
        assert.deepEqual(confirmArgs[1].actions, [MessageBox.Action.OK, MessageBox.Action.CANCEL], "Correct actions");
        messageBoxConfirmStub.restore();
    });

    QUnit.test("onPressDeleteButton - Should call deleteProductContext when user confirms deletion", function (assert) {
        const oController = this.oController;
        const oEvent = {
            getSource: sinon.stub()
        };
        const oButton = {
            getBindingContext: sinon.stub()
        };
        const oBindingContext = {
            getProperty: sinon.stub()
        };
        const sProductCode = "P123";
        oEvent.getSource.returns(oButton);
        oButton.getBindingContext.returns(oBindingContext);
        oBindingContext.getProperty.withArgs("productCode").returns(sProductCode);
        const oResourceBundle = {
            getText: sinon.stub()
        };
        oResourceBundle.getText.withArgs("confirmTheDeletion", [sProductCode]).returns(`Are you sure you want to delete product ${sProductCode}?`);
        oResourceBundle.getText.withArgs("deleteConfirmTitle").returns("Confirm Deletion");
        this.getModelStub = sinon.stub(this.oViewStub, "getModel");
        this.getModelStub.withArgs("i18n").returns({
            getResourceBundle: sinon.stub().returns(oResourceBundle)
        });
        const originalConfirm = MessageBox.confirm;
        MessageBox.confirm = function (message, options) {
            options.onClose(MessageBox.Action.OK);
        };
        const deleteProductContextStub = sinon.stub(CRUDHelper, "deleteProductContext");

        oController.onPressDeleteButton(oEvent);
        assert.ok(deleteProductContextStub.calledOnce, "CRUDHelper.deleteProductContext should be called once");
        assert.ok(deleteProductContextStub.calledWithExactly(oController, oBindingContext), "deleteProductContext called with correct arguments");
        MessageBox.confirm = originalConfirm;
        deleteProductContextStub.restore();
    });

    QUnit.test("onPressDeleteButton - Should not call deleteProductContext when user cancels deletion", function (assert) {
        const oController = this.oController;
        const oEvent = {
            getSource: sinon.stub()
        };
        const oButton = {
            getBindingContext: sinon.stub()
        };
        const oBindingContext = {
            getProperty: sinon.stub()
        };
        const sProductCode = "P123";

        oEvent.getSource.returns(oButton);
        oButton.getBindingContext.returns(oBindingContext);
        oBindingContext.getProperty.withArgs("productCode").returns(sProductCode);
        const oResourceBundle = {
            getText: sinon.stub()
        };
        oResourceBundle.getText.withArgs("confirmTheDeletion", [sProductCode]).returns(`Are you sure you want to delete product ${sProductCode}?`);
        oResourceBundle.getText.withArgs("deleteConfirmTitle").returns("Confirm Deletion");

        this.getModelStub = sinon.stub(this.oViewStub, "getModel");
        this.getModelStub.withArgs("i18n").returns({
            getResourceBundle: sinon.stub().returns(oResourceBundle)
        });
        const originalConfirm = MessageBox.confirm;
        MessageBox.confirm = function (message, options) {
            options.onClose(MessageBox.Action.CANCEL);
        };
        const deleteProductContextStub = sinon.stub(CRUDHelper, "deleteProductContext");

        oController.onPressDeleteButton(oEvent);
        assert.ok(deleteProductContextStub.notCalled, "CRUDHelper.deleteProductContext should not be called");
        MessageBox.confirm = originalConfirm;
        deleteProductContextStub.restore();
    });

    QUnit.test("onRefreshButtonPressed - Should refresh the binding when onRefreshButtonPressed is called", function (assert) {
        const oController = this.oController;

        oController.onRefreshButtonPressed();
        assert.ok(this.oTableStub.getBinding.calledOnce, "getBinding should be called once on oTable");
        assert.ok(this.oTableStub.getBinding.calledWithExactly("items"), "getBinding called with 'items'");
        assert.ok(this.oBindingStub.refresh.calledOnce, "refresh should be called once on the binding");
    });

    QUnit.test("onPressEditButton - Should set editContext, prepare product data, and open the edit dialog", function (assert) {
        const oController = this.oController;
        const initProductAddModelStub = sinon.stub(oController, "initProductAddModel");
        const initProductAddDialogStub = sinon.stub(DialogHelper, "initProductAddDialog");
        const oItemData = { id: 1, name: "Test Product" };
        const oItemContextPath = "/Products/1";
        const oItemContext = {
            getObject: sinon.stub().returns(oItemData),
            getPath: sinon.stub().returns(oItemContextPath)
        };
        const oSourceControl = {
            getBindingContext: sinon.stub().returns(oItemContext)
        };
        const oEvent = {
            getSource: sinon.stub().returns(oSourceControl)
        };

        oController.onPressEditButton(oEvent);
        assert.strictEqual(oController.editContext, oItemContext, "editContext should be set to oItemContext");
        assert.ok(initProductAddModelStub.calledOnce, "initProductAddModel should be called once");
        const oExpectedProductData = {
            id: 1,
            name: "Test Product",
            isEdit: true,
            contextPath: "/Products/1"
        };
        assert.deepEqual(initProductAddModelStub.firstCall.args[0], oExpectedProductData, "initProductAddModel called with correct product data");
        assert.ok(initProductAddDialogStub.calledOnce, "DialogHelper.initProductAddDialog should be called once");
        assert.ok(initProductAddDialogStub.calledWithExactly(oController), "DialogHelper.initProductAddDialog called with controller instance");
        initProductAddModelStub.restore();
        initProductAddDialogStub.restore();
    });

    QUnit.test("dataReceived - Should return data from table items", function (assert) {
        const oController = this.oController;
        this.oTableStub.getItems = function() {};
        const getItemsStub = sinon.stub(this.oTableStub, "getItems").returns([]);
    
        const oItem1 = {
            getBindingContext: function () {
                return {
                    getObject: function () { return { id: 1, name: "Product 1" }; }
                };
            }
        };
        const oItem2 = {
            getBindingContext: function () {
                return {
                    getObject: function () { return { id: 2, name: "Product 2" }; }
                };
            }
        };
        getItemsStub.returns([oItem1, oItem2]);
        const oData = oController.dataReceived();
        assert.deepEqual(oData, [{ id: 1, name: "Product 1" }, { id: 2, name: "Product 2" }], "Should return correct data from table items");
        getItemsStub.restore();
    });

    QUnit.test("createColumnConfig - Should return correct column configuration", function (assert) {
        const EdmType = sap.ui.export.EdmType;
        const oResourceBundle = {
            getText: sinon.stub()
        };
        const oViewStub = this.oViewStub;
        oViewStub.getModel = sinon.stub().withArgs("i18n").returns({
            getResourceBundle: sinon.stub().returns(oResourceBundle)
        });

        oResourceBundle.getText.withArgs("columnSeries").returns("Series");
        oResourceBundle.getText.withArgs("columnSeriesDescription").returns("Series Description");
        oResourceBundle.getText.withArgs("columnProductCode").returns("Product Code");
        oResourceBundle.getText.withArgs("columnDescription").returns("Description");
        oResourceBundle.getText.withArgs("columnBrand").returns("Brand");
        oResourceBundle.getText.withArgs("columnIsActive").returns("Is Active");
    
        const aColumnConfig = this.oController.createColumnConfig();

        assert.strictEqual(aColumnConfig.length, 6, "The column config should contain 6 columns.");
        assert.deepEqual(aColumnConfig[0], {
            label: "Series",
            property: "series",
            width: "20",
            type: EdmType.String
        }, "First column config is correct.");
    
        assert.deepEqual(aColumnConfig[1], {
            label: "Series Description",
            property: "seriesDescription",
            width: "20",
            type: EdmType.String
        }, "Second column config is correct.");
    
        assert.deepEqual(aColumnConfig[2], {
            label: "Product Code",
            property: "productCode",
            width: "20",
            type: EdmType.String
        }, "Third column config is correct.");
    
        assert.deepEqual(aColumnConfig[3], {
            label: "Description",
            property: "description",
            width: "20",
            type: EdmType.String
        }, "Fourth column config is correct.");
    
        assert.deepEqual(aColumnConfig[4], {
            label: "Brand",
            property: "brand",
            width: "10",
            type: EdmType.String
        }, "Fifth column config is correct.");
    
        assert.deepEqual(aColumnConfig[5], {
            label: "Is Active",
            property: "active",
            width: "10",
            type: EdmType.Boolean
        }, "Sixth column config is correct.");
    });
    
    QUnit.module("Main Controller - onSearch", {
        beforeEach: function () {
            this.oController = new Controller();
            this.oViewStub = {
                byId: sinon.stub(),
                getModel: function () {}
            };
            this.getViewStub = sinon.stub(this.oController, "getView").returns(this.oViewStub);
            this.oBindingStub = {
                filter: sinon.stub()
            };
            this.oTableStub = {
                getBinding: sinon.stub().withArgs("items").returns(this.oBindingStub)
            };
            this.oViewStub.byId.withArgs("tableProducts").returns(this.oTableStub);

            this.oSeriesInput = { setValue: sinon.spy() };
            this.oSeriesDescInput = { setValue: sinon.spy() };
            this.oProductCodesInput = { setValue: sinon.spy() };
            this.oProductCodesDescInput = { setValue: sinon.spy() };
            this.oBrandInput = { setSelectedKey: sinon.spy() };
            this.oStatusSelect = { setSelectedKey: sinon.spy() };
            
            this.oViewStub.byId.withArgs("seriesInput").returns(this.oSeriesInput);
            this.oViewStub.byId.withArgs("seriesDescInput").returns(this.oSeriesDescInput);
            this.oViewStub.byId.withArgs("productCodesInput").returns(this.oProductCodesInput);
            this.oViewStub.byId.withArgs("productCodesDescInput").returns(this.oProductCodesDescInput);
            this.oViewStub.byId.withArgs("brandInput").returns(this.oBrandInput);
            this.oViewStub.byId.withArgs("statusSelect").returns(this.oStatusSelect);
            
           
        },
        afterEach: function () {
            this.getViewStub.restore();
            this.oViewStub.byId.reset();
            this.oTableStub.getBinding.reset();
            this.oBindingStub.filter.reset();
        }
    });
    
    QUnit.test("onReset - Should reset all input fields and call onSearch", function (assert) {
        this.onSearchStub = sinon.stub(this.oController, "onSearch");
        this.oController.onReset();
    
        assert.ok(this.oSeriesInput.setValue.calledWith(""), "Series input should be reset");
        assert.ok(this.oSeriesDescInput.setValue.calledWith(""), "Series description input should be reset");
        assert.ok(this.oProductCodesInput.setValue.calledWith(""), "Product codes input should be reset");
        assert.ok(this.oProductCodesDescInput.setValue.calledWith(""), "Product codes description input should be reset");
        assert.ok(this.oBrandInput.setSelectedKey.calledWith(""), "Brand input should be reset");
        assert.ok(this.oStatusSelect.setSelectedKey.calledWith(""), "Status select should be reset");
        assert.ok(this.onSearchStub.calledOnce, "onSearch should be called after reset");
        this.onSearchStub.restore();
    });
    
    QUnit.test("No input values should apply no filters", function (assert) {
        const oController = this.oController;
        const inputFields = ["seriesInput", "seriesDescInput", "productCodesInput", "productCodesDescInput"];
        inputFields.forEach((id) => {
            const inputStub = {
                getValue: sinon.stub().returns("")
            };
            this.oViewStub.byId.withArgs(id).returns(inputStub);
        });
        const statusSelectStub = {
            getSelectedKey: sinon.stub().returns("")
        };
        const brandSelectStub = {
            getSelectedKey: sinon.stub().returns("")
        }
        this.oViewStub.byId.withArgs("statusSelect").returns(statusSelectStub);
        this.oViewStub.byId.withArgs("brandInput").returns(brandSelectStub);
        oController.onSearch();
        assert.ok(this.oBindingStub.filter.calledOnce, "Binding's filter method should be called once");
        assert.deepEqual(this.oBindingStub.filter.firstCall.args[0], [], "No filters should be applied when all inputs are empty");
    });

    QUnit.test("Input values should create appropriate filters", function (assert) {
        const oController = this.oController;
        const seriesInputStub = {
            getValue: sinon.stub().returns("Series1")
        };
        this.oViewStub.byId.withArgs("seriesInput").returns(seriesInputStub);
        const productCodeInputStub = {
            getValue: sinon.stub().returns("PC1")
        };
        this.oViewStub.byId.withArgs("productCodesInput").returns(productCodeInputStub);
        const emptyInputStubs = ["seriesDescInput", "productCodesDescInput"];
        emptyInputStubs.forEach((id) => {
            const inputStub = {
                getValue: sinon.stub().returns("")
            };
            this.oViewStub.byId.withArgs(id).returns(inputStub);
        });
        const statusSelectStub = {
            getSelectedKey: sinon.stub().returns("")
        };
        const brandSelectStub = {
            getSelectedKey: sinon.stub().returns("")
        }
        this.oViewStub.byId.withArgs("statusSelect").returns(statusSelectStub);
        this.oViewStub.byId.withArgs("brandInput").returns(brandSelectStub);
        oController.onSearch();
        assert.ok(this.oBindingStub.filter.calledOnce, "Binding's filter method should be called once");
        const expectedFilters = [
            new Filter({
                path: "series",
                operator: FilterOperator.Contains,
                value1: "Series1",
                caseSensitive: false
            }),
            new Filter({
                path: "productCode",
                operator: FilterOperator.Contains,
                value1: "PC1",
                caseSensitive: false
            })
        ];
        const actualFilters = this.oBindingStub.filter.firstCall.args[0];
        assert.equal(actualFilters.length, expectedFilters.length, "Two filters should be applied");
        for (let i = 0; i < expectedFilters.length; i++) {
            assert.strictEqual(actualFilters[i].sPath, expectedFilters[i].sPath, `Filter ${i} path should match`);
            assert.strictEqual(actualFilters[i].sOperator, expectedFilters[i].sOperator, `Filter ${i} operator should match`);
            assert.strictEqual(actualFilters[i].oValue1, expectedFilters[i].oValue1, `Filter ${i} value1 should match`);
            assert.strictEqual(actualFilters[i].bCaseSensitive, expectedFilters[i].bCaseSensitive, `Filter ${i} caseSensitive should match`);
        }
    });

    QUnit.test("Status selected as 'true' should create active filter", function (assert) {
        const oController = this.oController;
        const inputFields = ["seriesInput", "seriesDescInput", "productCodesInput", "productCodesDescInput"];
        inputFields.forEach((id) => {
            const inputStub = {
                getValue: sinon.stub().returns("")
            };
            this.oViewStub.byId.withArgs(id).returns(inputStub);
        });
        const statusSelectStub = {
            getSelectedKey: sinon.stub().returns("true")
        };
        const brandSelectStub = {
            getSelectedKey: sinon.stub().returns("")
        }
        this.oViewStub.byId.withArgs("brandInput").returns(brandSelectStub);
        this.oViewStub.byId.withArgs("statusSelect").returns(statusSelectStub);
        oController.onSearch();
        assert.ok(this.oBindingStub.filter.calledOnce, "Binding's filter method should be called once");
        const expectedFilter = new Filter("active", FilterOperator.EQ, true);
        const actualFilters = this.oBindingStub.filter.firstCall.args[0];
        assert.equal(actualFilters.length, 1, "One filter should be applied");
        const actualFilter = actualFilters[0];
        assert.strictEqual(actualFilter.sPath, expectedFilter.sPath, "Filter path should match");
        assert.strictEqual(actualFilter.sOperator, expectedFilter.sOperator, "Filter operator should match");
        assert.strictEqual(actualFilter.oValue1, expectedFilter.oValue1, "Filter value1 should match");
    });
});
