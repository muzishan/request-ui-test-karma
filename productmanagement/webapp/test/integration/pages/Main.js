sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/ui/test/actions/Press",
  	"sap/ui/test/actions/EnterText",
	"sap/ui/test/matchers/PropertyStrictEquals",
], function (Opa5, Press, EnterText, PropertyStrictEquals ) {
	"use strict";
	var sViewName = "Main";

	Opa5.createPageObjects({
		onTheViewPage: {

			actions: {
				iPressTheAddButton: function () {
					return this.waitFor({
						id: "addButton",
						viewName: sViewName,
						actions: new Press(),
						errorMessage: "Could not find the Add button"
					});
				},
				iFillTheProductForm: function (oProductData) {
					var that = this;
					return this.waitFor({
					  controlType: "sap.m.Dialog",
					  viewName: sViewName,
					  matchers: new PropertyStrictEquals({ name: "title", value: "Create a new Product" }),
					  success: function (aDialogs) {
						if (aDialogs.length > 0) {
						  that.waitFor({
							controlType: "sap.m.Input",
							matchers: new PropertyStrictEquals({ name: "id", value: "__component1---Main--seriesDialogInput" }),
							searchOpenDialogs: true,
							actions: new EnterText({ text: oProductData.series }),
							success: function () {
							  Opa5.assert.ok(true, "Entered series");
							},
							errorMessage: "Could not find the series input field."
						  });
						  that.waitFor({
							controlType: "sap.m.Input",
							matchers: new PropertyStrictEquals({ name: "id", value: "__component1---Main--seriesDescDialogInput" }),
							searchOpenDialogs: true,
							actions: new EnterText({ text: oProductData.seriesDescription }),
							success: function () {
							  Opa5.assert.ok(true, "Entered series description");
							},
							errorMessage: "Could not find the series description input field."
						  });
						  that.waitFor({
							controlType: "sap.m.Input",
							matchers: new PropertyStrictEquals({ name: "id", value: "__component1---Main--productCodeDialogInput" }),
							searchOpenDialogs: true,
							actions: new EnterText({ text: oProductData.productCode }),
							success: function () {
							  Opa5.assert.ok(true, "Entered product code");
							},
							errorMessage: "Could not find the product code input field."
						  });
						  that.waitFor({
							controlType: "sap.m.Input",
							matchers: new PropertyStrictEquals({ name: "id", value: "__component1---Main--productDescDialogInput" }),
							searchOpenDialogs: true,
							actions: new EnterText({ text: oProductData.description }),
							success: function () {
							  Opa5.assert.ok(true, "Entered product description");
							},
							errorMessage: "Could not find the product description input field."
						  });
						} else {
						  Opa5.assert.ok(false, "Create Product dialog did not open.");
						}
					  },
					  errorMessage: "Could not find the Create Product dialog."
					});
				  },
				iPressTheSaveButton: function () {
					return this.waitFor({
						id: "saveButton",
						viewName: sViewName,
						actions: new Press(),
						errorMessage: "Could not find the Save button."
					});
				}
			},
			assertions: {
				iShouldSeeThePageView: function () {
					return this.waitFor({
						id: "dynamicPage",
						viewName: sViewName,
						success: function () {
							Opa5.assert.ok(true, "The " + sViewName + " view is displayed");
						},
						errorMessage: "Did not find the " + sViewName + " view"
					});
				},
				iShouldSeeTheNewProductInTheList: function (sProductCode) {
					var that = this;
					return this.waitFor({
					  controlType: "sap.m.Table",
					  viewName: sViewName,
					  success: function (aTables) {
						if (aTables.length > 0) {
						  var oTable = aTables[0];
						  var aItems = oTable.getItems();
						  var bFound = aItems.some(function (oItem) {
							var oContext = oItem.getBindingContext();
							if (oContext) {
							  var sCode = oContext.getProperty("productCode");
							  console.log("Checking productCode:", sCode);
							  return sCode === sProductCode;
							}
							return false;
						  });
						  Opa5.assert.ok(bFound, "Found the new product with productCode: " + sProductCode);
						} else {
						  Opa5.assert.ok(false, "Could not find the table in the view.");
						}
					  },
					  errorMessage: "Could not find the table."
					});
				},
			}
		}
	});
});
