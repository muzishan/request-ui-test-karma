sap.ui.define([
    "com/kion/sdr/ui/productmanagement/utils/DialogHelper",
    "sap/ui/core/Fragment",
    "sap/m/Dialog",
], function (DialogHelper, Fragment, Dialog) {
    "use strict";

    QUnit.module("Dialog Helper Tests", {
        afterEach: function () {
            sinon.restore();
            if (Fragment.load.restore) {
                Fragment.load.restore();
            }
        }
    });

    QUnit.test("Should create and open dialog when oProductDialog is null", function (assert) {
        const done = assert.async();
        const oView = {
            getId: function () { return "myViewId"; },
            addDependent: sinon.spy()
        };

        const oController = {
            oProductDialog: null,
            getView: function () {
                return oView;
            }
        };

        let oDialog = new Dialog();
        let fragmentLoadStub = sinon.stub(Fragment, "load").returns(Promise.resolve(oDialog));
        let openSpy = sinon.spy(oDialog, "open");

        DialogHelper.initProductAddDialog(oController);
        setTimeout(function () {
            assert.ok(fragmentLoadStub.calledOnce, "Fragment.load should be called once");
            assert.ok(fragmentLoadStub.calledWith({
                id: "myViewId",
                name: "com.kion.sdr.ui.productmanagement.view.fragments.AddOrEditDialog",
                controller: oController
            }), "Fragment.load called with correct parameters");
            assert.ok(oView.addDependent.calledOnce, "addDependent should be called once");
            assert.ok(openSpy.calledOnce, "Dialog.open should be called once");
            oDialog.destroy();
            done();
        }, 0);
    });

    QUnit.test("Should create new dialog when oProductDialog is destroyed", function (assert) {
        const done = assert.async();
        const oView = {
            getId: function () { return "myViewId"; },
            addDependent: sinon.spy()
        };
    
        let oOldDialog = new Dialog();
        oOldDialog.destroy();
    
        const oController = {
            oProductDialog: oOldDialog,
            getView: function () {
                return oView;
            }
        };
        let oNewDialog = new Dialog();
        let fragmentLoadStub = sinon.stub(Fragment, "load").returns(Promise.resolve(oNewDialog));
        let openSpy = sinon.spy(oNewDialog, "open");
        DialogHelper.initProductAddDialog(oController);

        fragmentLoadStub.returnValues[0].then(function() {
            assert.ok(fragmentLoadStub.calledOnce, "Fragment.load should be called once for new dialog");
            assert.ok(oView.addDependent.calledOnce, "addDependent should be called once for new dialog");
            assert.ok(openSpy.calledOnce, "NewDialog.open should be called once");
            fragmentLoadStub.restore();
            openSpy.restore();
            oNewDialog.destroy();
            done();
        });
    });
    QUnit.test("Should open existing dialog when oProductDialog is not null and not destroyed", function (assert) {
        const done = assert.async();
        const oView = {
            getId: function () { return "myViewId"; },
            addDependent: sinon.spy()
        };
    
        let oExistingDialog = new Dialog();
        const openSpy = sinon.spy(oExistingDialog, "open");
    
        const oController = {
            oProductDialog: oExistingDialog,
            getView: function () {
                return oView;
            }
        };

        DialogHelper.initProductAddDialog(oController);
        assert.ok(openSpy.calledOnce, "Existing Dialog.open should be called once");
        assert.notOk(Fragment.load.called, "Fragment.load should not be called");
        assert.notOk(oView.addDependent.called, "addDependent should not be called for existing dialog");
    
        oExistingDialog.destroy();
        done();
    });
});
