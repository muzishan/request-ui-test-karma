sap.ui.define([], function () {
    "use strict";
    return {
        validateCreateProduct: function (oController, aInputs) {
			const oView = oController.getView();
			let bValidationError = false;
            const that = this;
			aInputs.forEach(function (oInput) {
				bValidationError = that.checkInputValidate(oView.byId(oInput)) || bValidationError;
			}, oController);

            return bValidationError;
		},
        checkInputValidate: function (oInput) {
			let sValueState = "None";
			let bValidationError = false;
			const oBinding = oInput.getBinding("value");

			try {
				oBinding.getType().validateValue(oInput.getValue());
			} catch {
				sValueState = "Error";
				bValidationError = true;
			}

			oInput.setValueState(sValueState);

			return bValidationError;
		}
    };
});