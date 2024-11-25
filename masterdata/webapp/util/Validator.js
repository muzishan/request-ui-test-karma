sap.ui.define([], function () {
    "use strict";
    return {
        validateInputs: function (oController, aInputs) {
            // collect input controls
            const oView = oController.getView();
            let bValidationError = false;
            const that = this;
            aInputs.forEach(function (oInput) {
                bValidationError = that.checkInputValidate(oInput, oView.byId(oInput)) || bValidationError;
            }, oController);

            return bValidationError;
        },
        checkInputValidate: function (oInput, oInputControl) {
            let sValueState = "None";
            let bValidationError = false;

            try {
                if (oInput.startsWith('comboBox')) {
                    const oBinding = oInputControl.getBinding("selectedKey");
                    oBinding.getType().validateValue(oInputControl.getSelectedKey());
                } else if (oInput.startsWith('datePicker')) {
                    const oBinding = oInputControl.getBinding("value");
                    oBinding.getType().validateValue(oInputControl.getDateValue());
                } else {
                    const oBinding = oInputControl.getBinding("value");
                    oBinding.getType().validateValue(oInputControl.getValue());
                }
            } catch {
                sValueState = "Error";
                bValidationError = true;
            }

            oInputControl.setValueState(sValueState);

            return bValidationError;
        },
        formatUploadData: function (excelRow) {
            if (!excelRow || excelRow.length < 1 ) {
                return null;
            }
            if (!Object.keys(excelRow[0]).includes('Category')
                || !Object.keys(excelRow[0]).includes('Code')
                || !Object.keys(excelRow[0]).includes('SeriesCode')
                || !Object.keys(excelRow[0]).includes('SalesOrgCode')
                || !Object.keys(excelRow[0]).includes('Discount')
                || !Object.keys(excelRow[0]).includes('ValidFrom')
            ) {
                return null;
            }
            return excelRow.map((i) => {
                const validFrom = i['ValidFrom'] ?  new Date(i['ValidFrom']) : undefined;
                return {
                    "category": i['Category'],
                    "code": i['Code'],
                    "seriesCode": i['SeriesCode'],
                    "salesOrgCode": i['SalesOrgCode'],
                    "discount": parseFloat(i['Discount']),
                    "validFrom": validFrom ? `${validFrom.getFullYear()}-${String(validFrom.getMonth() + 1).padStart(2, '0')}-${String(validFrom.getDate()).padStart(2, '0')}` : undefined
                };
            });
        }
    };
});