sap.ui.define([], function () {
    "use strict";
    return {
        formatStatus: function (isActive) {
            return isActive === "true" ? "Active" : "Inactive";
        },
        saveButtonText: function (isEdit, sSaveText, sUpdateText) {
            return isEdit ? sUpdateText : sSaveText;
        },
        formatDialogTitle: function (isEdit, sAddTitle, sUpdateTitle) {
            return isEdit ? sUpdateTitle : sAddTitle;
        }
    };
});