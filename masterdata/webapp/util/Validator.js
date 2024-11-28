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
        formatUploadData: function (excelRow, entityType) {
            if (!excelRow || excelRow.length < 1 ) {
                return 'Excel File';
            }

            const errorField = [];
            if (entityType === 'batteryChargerDiscount') {
                if (!Object.keys(excelRow[0]).includes('Category')) {errorField.push('Category');}
                if (!Object.keys(excelRow[0]).includes('Code')) {errorField.push('Code');}
                if (!Object.keys(excelRow[0]).includes('SalesOrgCode')) {errorField.push('SalesOrgCode');}
                if (!Object.keys(excelRow[0]).includes('Discount[%]')) {errorField.push('Discount[%]');}
                if (!Object.keys(excelRow[0]).includes('ValidFrom')) {errorField.push('ValidFrom');}
            } else if (entityType === 'customer'){
                if (!Object.keys(excelRow[0]).includes('Name 1')) {errorField.push('Name 1');}
                if (!Object.keys(excelRow[0]).includes('Sales Org')) {errorField.push('Sales Org');}
            }

            if (errorField.length > 0) {
                return errorField.join(', ');
            }

            return excelRow.map((i) => {
                if (entityType === 'batteryChargerDiscount') {
                    const validFrom = i['ValidFrom'] ?  new Date(i['ValidFrom']) : undefined;
                    return {
                        "category": i['Category'],
                        "code": i['Code'],
                        "seriesCode": i['SeriesCode'],
                        "salesOrgCode": i['SalesOrgCode'],
                        "discount": parseFloat(i['Discount[%]']),
                        "validFrom": validFrom ? `${validFrom.getFullYear()}-${String(validFrom.getMonth() + 1).padStart(2, '0')}-${String(validFrom.getDate()).padStart(2, '0')}` : undefined
                    };
                } else if (entityType === 'customer'){
                    return {
                        "name1": i['Name 1'],
                        "name2": i['Name 2'],
                        "salesOrgCode": i['Sales Org'],
                        "customerNo": i['Customer No.'],
                        "additionalCustomerNo": i['Additional Customer No.'],
                        "kionCustomerNo": i['KION Customer No.'],
                        "street": i['Street'],
                        "location": i['Location'],
                        "industryCode": i['Industry'],
                        "postCode": i['Post Code'],
                        "frameContractNumber": i['Frame Contract Number'],
                        "countryCode": i['Country']};
                }
            });
        }
    };
});