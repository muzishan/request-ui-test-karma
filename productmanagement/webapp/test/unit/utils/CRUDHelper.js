sap.ui.define([
    "com/kion/sdr/ui/productmanagement/utils/CRUDHelper",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (CRUDHelper, MessageBox, MessageToast) {
    "use strict";

    QUnit.module("CRUDHelper - tests", {
        beforeEach: function () {
            this.oController = {
                getView: function () {
                    return {
                        byId: function (sId) {
                            return this.mockComponents[sId];
                        }.bind(this),
                        getModel: function (sName) {
                            return {
                                getResourceBundle: function () {
                                    return {
                                        getText: function (key) {
                                            return key;
                                        }
                                    };
                                }
                            };
                        }
                    };
                },
                sObjectId: "someObjectId",
                mockComponents: {}
            };
            this.messageBoxErrorStub = sinon.stub(MessageBox, "error");
            this.messageToastShowStub = sinon.stub(MessageToast, "show");
        },
        afterEach: function () {
            this.messageBoxErrorStub.restore();
            this.messageToastShowStub.restore();
            sinon.restore();
        }
    });
    QUnit.test("createProductContext - success", function (assert) {
        const done = assert.async();
        const createSpy = sinon.spy();
        const refreshSpy = sinon.spy();
        const oTable = {
            getBinding: function (sType) {
                if (sType === "items") {
                    return {
                        create: createSpy,
                        refresh: refreshSpy
                    };
                }
            }
        };
        const oController = {
            oTable: oTable
        };
        const oData = { productId: "testProduct" };

        CRUDHelper.createProductContext(oController, oData);
        assert.ok(createSpy.calledOnce, "create method was called");
        assert.ok(refreshSpy.calledOnce, "refresh method was called after create");
        done();
    });
    QUnit.test("deleteProductContext - success case", function (assert) {
        const done = assert.async();
        let deleteCallCount = 0;

        const oContextMock = {
            delete: function () {
                deleteCallCount++;
                return Promise.resolve();
            }
        };
        const oSelectedItem = {
            getBindingContext: function () {
                return oContextMock;
            }
        };
        const oTableMock = {
            getSelectedItems: function () {
                return [oSelectedItem];
            },
            removeSelections: function () {
                assert.ok(true, "Selections removed after delete");
            }
        };
        this.oController.mockComponents = {
            "tableProducts": oTableMock,
            "deleteButton": {
                setVisible: function (bVisible) {
                    assert.strictEqual(bVisible, false, "Delete button hidden after delete");
                }
            }
        };

        CRUDHelper.deleteProductContext(this.oController);
        setTimeout(() => {
            assert.strictEqual(deleteCallCount, 1, "Delete function called once");
            done();
        }, 100);
    });
    QUnit.test("deleteProductContext - error case", function (assert) {
        const done = assert.async();
        let deleteCallCount = 0;
        const oErrorContextMock = {
            delete: function () {
                deleteCallCount++;
                return Promise.reject({ message: "errorDeletingProduct" });
            }
        };
        const oErrorSelectedItem = {
            getBindingContext: function () {
                return oErrorContextMock;
            }
        };
        const oTableMock = {
            getSelectedItems: function () {
                return [oErrorSelectedItem];
            },
            removeSelections: function () {
                assert.ok(true, "Selections removed after delete attempt");
            }
        };
        const oResourceBundleMock = {
            getText: function (key) {
                return key;
            }
        };
        this.oController.getView = function () {
            return {
                byId: function (id) {
                    if (id === "tableProducts") return oTableMock;
                    if (id === "deleteButton") return {
                        setVisible: function (bVisible) {
                            assert.strictEqual(bVisible, false, "Delete button hidden after delete attempt");
                        }
                    };
                },
                getModel: function (modelName) {
                    if (modelName === "i18n") {
                        return {
                            getResourceBundle: function () {
                                return oResourceBundleMock;
                            }
                        };
                    }
                }
            };
        };
        const messageBoxErrorStub = this.messageBoxErrorStub;

        CRUDHelper.deleteProductContext(this.oController);
        setTimeout(() => {
            assert.strictEqual(deleteCallCount, 1, "Delete function called once");
            assert.ok(messageBoxErrorStub.calledOnce, "MessageBox.error was called due to deletion error");
            assert.ok(messageBoxErrorStub.calledWith("errorDeletingProduct"), "MessageBox.error called with correct error message");
            done();
        }, 100);
    });

    QUnit.test("updateProductContext - test", function (assert) {
        const done = assert.async();
        const getTextStub = sinon.stub().returns("Product updated successfully");
        const oResourceBundle = { getText: getTextStub };
        const i18nModel = { getResourceBundle: sinon.stub().returns(oResourceBundle) };
        const setPropertyStub = sinon.stub().returns(Promise.resolve());
        const oContext = {
            setProperty: setPropertyStub,
            hasPendingChanges: sinon.stub().returns(false)
        };
        const oController = {
            getView: sinon.stub().returns({
                getModel: sinon.stub().withArgs("i18n").returns(i18nModel)
            }),
            editContext: oContext
        };
        const oData = {
            productId: "123",
            productName: "Test Product",
            isEdit: true,
            contextPath: "/some/path"
        };
    
        CRUDHelper.updateProductContext(oController, oData);
        setTimeout(function () {
            assert.notOk(oData.isEdit, "`isEdit` should be deleted");
            assert.notOk(oData.contextPath, "`contextPath` should be deleted");
            assert.ok(setPropertyStub.calledTwice, "setProperty should be called for each property in oData except `isEdit` and `contextPath`");
            assert.ok(setPropertyStub.firstCall.calledWith("productId", "123"), "setProperty should be called with the correct key and value");
            assert.ok(setPropertyStub.secondCall.calledWith("productName", "Test Product"), "setProperty should be called with the correct key and value");
            assert.ok(getTextStub.calledOnce, "getText should be called to fetch the success message");
            assert.ok(getTextStub.calledWith("productUpdateSuccess"), "getText should be called with the correct key");
            
            done();
        }, 0);
    });
});