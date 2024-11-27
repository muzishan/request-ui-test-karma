sap.ui.define([], function () {
    "use strict";
    return {
        formatStatus: function (isActive) {
            return isActive === "true" ? "Active" : "Inactive";
        },
        saveButtonText: function (isEdit, sSaveText, sUpdateText) {
            return isEdit ? sUpdateText : sSaveText;
        },
        formatDialogTitle: function (payload, sAddTitle, sUpdateTitle) {
            return payload.isEdit ? sUpdateTitle + ' ' + payload.code : sAddTitle;
        },
        checkIfUseCommaAsDecimalSeperator: function () {
            const numberWithDecimal = 1.1;
            const formattedNumber = numberWithDecimal.toLocaleString();
            return formattedNumber.includes(',');
        },
        replaceCommaToPointAsDecimalSeperator: function (num) {
            num = typeof num === "string" ? num : num?.toString();
            if (this.checkIfUseCommaAsDecimalSeperator()) {
                num = num.replace(/\./g, '').replace(',', '.');
            } else {
                num = num.replace(/\,/g, '');
            }
            return parseFloat(num);
        }
    };
});