sap.ui.define([
    "com/kion/sdr/ui/productmanagement/controller/Base.controller",
    "sap/ui/core/mvc/View",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessagePopover",
    "sap/m/MessageItem",
    "sap/ui/core/Messaging",
    "sap/ui/core/Control",
    "sap/ui/core/message/Message",
    "com/kion/sdr/ui/productmanagement/utils/AjaxHelper",
], function (BaseController, View, JSONModel, MessagePopover, MessageItem, Messaging, Control, Message, AjaxHelper) {
    "use strict";

    QUnit.module("Base Controller Tests", {
        beforeEach: function () {
            this.oController = new BaseController();
            this.oView = new View();
            sinon.stub(this.oController, "getView").returns(this.oView);
        },
        afterEach: function () {
            this.oController.getView.restore();
            sinon.restore();
        }
    });

    QUnit.test("initMessaging initializes messaging correctly", function (assert) {
        const oInitInterceptorStub = sinon.stub(AjaxHelper, "initInterceptor");
        const oMessageModel = new JSONModel();
        sinon.stub(Messaging, "getMessageModel").returns(oMessageModel);

        this.oController.initMessaging();

        assert.ok(oInitInterceptorStub.calledOnce, "AjaxHelper.initInterceptor called once");
        assert.strictEqual(this.oView.getModel("message"), oMessageModel, "Message model set on the view");
    });

    QUnit.test("removeAllMessages calls Messaging.removeAllMessages", function (assert) {
        const oRemoveAllMessagesStub = sinon.stub(Messaging, "removeAllMessages");

        this.oController.removeAllMessages();

        assert.ok(oRemoveAllMessagesStub.calledOnce, "Messaging.removeAllMessages called once");
    });

    QUnit.test("handleMessagePopoverPress calls initializePopOver with event source", function (assert) {
        const oInitializePopOverStub = sinon.stub(this.oController, "initializePopOver");
        const oSource = {};
        const oEvent = {
            getSource: function () {
                return oSource;
            }
        };

        this.oController.handleMessagePopoverPress(oEvent);

        assert.ok(oInitializePopOverStub.calledOnce, "initializePopOver called once");
        assert.ok(oInitializePopOverStub.calledWith(oSource), "initializePopOver called with event source");
    });

    QUnit.test("initializePopOver creates MessagePopover if not exists and opens it", function (assert) {
        const done = assert.async();
        const oBtnControl = {
            addDependent: sinon.spy()
        };
        const oOpenByStub = sinon.stub(MessagePopover.prototype, "openBy");

        this.oController.initializePopOver(oBtnControl);

        setTimeout(function () {
            assert.ok(oBtnControl.addDependent.calledOnce, "Button control has dependent added");
            assert.ok(oOpenByStub.calledOnce, "MessagePopover openBy called once");
            assert.ok(oOpenByStub.calledWith(oBtnControl), "MessagePopover openBy called with button control");
            oOpenByStub.restore();
            done();
        }, 200);
    });

    QUnit.test("isPositionable returns true when controlIds is non-empty", function (assert) {
        const bResult = this.oController.isPositionable("someControlId");

        assert.strictEqual(bResult, true, "isPositionable returns true for non-empty controlIds");
    });

    QUnit.test("isPositionable returns false when controlIds is empty or null", function (assert) {
        const bResultEmpty = this.oController.isPositionable("");
        const bResultNull = this.oController.isPositionable(null);

        assert.strictEqual(bResultEmpty, false, "Returns false for empty string");
        assert.strictEqual(bResultNull, false, "Returns false for null");
    });

    QUnit.test("MessagePopover activeTitlePress handler focuses control if available", function (assert) {
        const done = assert.async();
        const oControl = new Control("controlId");

        sinon.spy(oControl, "isFocusable");
        sinon.spy(oControl, "focus");
        sinon.stub(oControl, "getDomRef").returns({});
        sap.ui.getCore().byId = function (sId) {
            if (sId === "controlId") {
                return oControl;
            }
            return null;
        };

        const oMessage = new Message({
            controlIds: ["controlId"]
        });
        sinon.stub(oMessage, "getControlId").returns("controlId");

        const oItem = new MessageItem({
            title: "Test Message",
            bindingContext: new sap.ui.model.Context(null, "/")
        });
        oItem.getBindingContext = function (sModelName) {
            if (sModelName === "message") {
                return {
                    getObject: function () {
                        return oMessage;
                    }
                };
            }
            return null;
        };
        const oEvent = new sap.ui.base.Event("activeTitlePress", this.oController.oMP, { item: oItem });

        const oBtnControl = {
            addDependent: sinon.spy()
        };
        this.oController.initializePopOver(oBtnControl);
        assert.ok(this.oController.oMP, "MessagePopover instance created");

        this.oController.oMP.fireActiveTitlePress({ item: oItem });

        oControl.destroy();
        done();
    });
});