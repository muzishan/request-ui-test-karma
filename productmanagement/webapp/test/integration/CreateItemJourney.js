sap.ui.define([
    "sap/ui/test/opaQunit",
    "./pages/Main"
  ], function (opaTest) {
    "use strict";
  
    QUnit.module("Create Item Journey");
  
    opaTest("Should create a new product successfully", function (Given, When, Then) {
      // Arrangements
      Given.iStartMyApp();
  
      // Actions
      When.onTheViewPage.iPressTheAddButton();
      When.onTheViewPage.iFillTheProductForm({
        series: "Test Series",
        seriesDescription: "Test Series Description",
        productCode: "TEST123",
        description: "Test Product Description"
      });
      When.onTheViewPage.iPressTheSaveButton();
  
      // Assertions
      Then.onTheViewPage.iShouldSeeTheNewProductInTheList("TEST123");
  
      // Cleanup
      Then.iTeardownMyApp();
    });
  });