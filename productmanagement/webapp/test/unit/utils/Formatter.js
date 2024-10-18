/*global QUnit*/

sap.ui.define([
	"com/kion/sdr/ui/productmanagement/utils/Formatter"
], function (Formatter) {
	"use strict";
	
	QUnit.module("formatStatus");

	QUnit.test("should return 'active' when the isActive is 'true'", function (assert) {
		const isActive = "true"
		const res = Formatter.formatStatus(isActive)
		assert.strictEqual(res, "Active");
	});

	QUnit.test("should return 'InActive' when the isActive is not 'true'", function (assert) {
		const isActive = "false";
		const res = Formatter.formatStatus(isActive)
		assert.strictEqual(res, "InActive");
	});

	QUnit.module("saveButtonText");

	QUnit.test("Should return update text when isEdit is true", function (assert) {
		const isEdit = true;
		const sSaveText = "Save";
		const sUpdateText = "Update";
	
		const result = Formatter.saveButtonText(isEdit, sSaveText, sUpdateText);
	
		assert.strictEqual(result, sUpdateText, "The result should be 'Update' when isEdit is true");
	});
	
	QUnit.test("Should return save text when isEdit is false", function (assert) {
		const isEdit = false;
		const sSaveText = "Save";
		const sUpdateText = "Update";
	
		const result = Formatter.saveButtonText(isEdit, sSaveText, sUpdateText);
	
		assert.strictEqual(result, sSaveText, "The result should be 'Save' when isEdit is false");
	});
	QUnit.module("formatDialogTitle");

	QUnit.test("Should return update title when isEdit is true", function (assert) {
		const isEdit = true;
		const sAddTitle = "Add";
		const sUpdateTitle = "Update";

		const result = Formatter.formatDialogTitle(isEdit, sAddTitle, sUpdateTitle);

		assert.strictEqual(result, sUpdateTitle, "The result should be 'Update' when isEdit is true")
	})

	QUnit.test("Should return Add title when isEdit is false", function (assert) {
		const isEdit = false;
		const sAddTitle = "Add";
		const sUpdateText = "Update";

		const result = Formatter.formatDialogTitle(isEdit, sAddTitle, sUpdateText);

		assert.strictEqual(result, sAddTitle, "The result should be 'Add' when isEdit is false")
	})

});
