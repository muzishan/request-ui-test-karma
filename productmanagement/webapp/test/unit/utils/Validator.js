sap.ui.define([
    "com/kion/sdr/ui/productmanagement/utils/Validator",
    "sap/m/Input",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/type/String",
], function (Validator, Input, JSONModel, StringType) {
    "use strict";

    QUnit.module("Validator Tests", {
        beforeEach: function () {
            this.oController = {
                getView: function () {
                    return this.oView;
                }.bind(this)
            };
            this.oView = {
                byId: function (sId) {
                    return this[sId];
                }
            };
            this.input1 = new Input("input1", {
                value: {
                    path: "/value1",
                    type: new StringType({}, { maxLength: 5 })
                }
            });
            this.input2 = new Input("input2", {
                value: {
                    path: "/value2",
                    type: new StringType({}, { maxLength: 5 })
                }
            });
            let oModel = new JSONModel({
                value1: "",
                value2: ""
            });

            this.input1.setModel(oModel);
            this.input2.setModel(oModel);
            this.oView.input1 = this.input1;
            this.oView.input2 = this.input2;
        },
        afterEach: function () {
            this.input1.destroy();
            this.input2.destroy();
        }
    });
    QUnit.test("validateCreateProduct should return false when inputs are valid", function (assert) {
        this.input1.setValue("12345");
        this.input2.setValue("abc");

        let aInputs = ["input1", "input2"];
        let bValidationError = Validator.validateCreateProduct(this.oController, aInputs);

        assert.strictEqual(bValidationError, false, "Validation error should be false");
        assert.strictEqual(this.input1.getValueState(), "None", "Input1 should have None state");
        assert.strictEqual(this.input2.getValueState(), "None", "Input2 should have None state");
    });

    QUnit.test("checkInputValidate should return true for invalid input", function (assert) {
        this.input1.setValue("123456");

        let bValidationError = Validator.checkInputValidate(this.input1);

        assert.strictEqual(bValidationError, true, "Validation error should be true");
        assert.strictEqual(this.input1.getValueState(), "Error", "Input1 should have Error state");
    });

    QUnit.test("checkInputValidate should return false for valid input", function (assert) {
        this.input1.setValue("12345");

        let bValidationError = Validator.checkInputValidate(this.input1);

        assert.strictEqual(bValidationError, false, "Validation error should be false");
        assert.strictEqual(this.input1.getValueState(), "None", "Input1 should have None state");
    });
});