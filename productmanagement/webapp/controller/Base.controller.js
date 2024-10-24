sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/m/MessagePopover",
        "sap/m/MessageItem",
        "sap/ui/core/Messaging",
        "sap/ui/core/ElementRegistry",
        "sap/ui/dom/isBehindOtherElement",
        "com/kion/sdr/ui/productmanagement/utils/AjaxHelper"
    ],
    function (Controller, MessagePopover, MessageItem, Messaging, ElementRegistry, isBehindOtherElement, AjaxHelper) {
        "use strict";

        return Controller.extend("com.kion.sdr.ui.productmanagement.controller.Base", {
            initMessaging: function () {
                AjaxHelper.initInterceptor();
                const oView = this.getView();
                oView.setModel(Messaging.getMessageModel(), "message");
                //Messaging.registerObject(oView, true);
            },
            removeAllMessages: function () {
                Messaging.removeAllMessages();
            },
            handleMessagePopoverPress: function (oEvent) {
                this.initializePopOver(oEvent.getSource());
            },
            initializePopOver: function (oBtnControl) {
                if (!this.oMp) {
                    this.oMP = new MessagePopover({
                        activeTitlePress: function (oEvent) {
                            const oItem = oEvent.getParameter("item"),
                                oMessage = oItem.getBindingContext("message").getObject(),
                                oControl = ElementRegistry.get(oMessage.getControlId());

                            if (oControl) {
                                setTimeout(function(){
                                    const bIsBehindOtherElement = isBehindOtherElement(oControl.getDomRef());
                                    if (bIsBehindOtherElement) {
                                        this.close();
                                    }
                                    if (oControl.isFocusable()) {
                                        oControl.focus();
                                    }
                                }.bind(this), 300);
                            }
                        },
                        items: {
                            path: "message>/",
                            template: new MessageItem({
                                title: "{message>message}",
                                subtitle: "{message>additionalText}",
                                type: "{message>type}",
                                description: "{message>description}",
                                activeTitle: {parts: [{path: 'message>controlIds'}], formatter: this.isPositionable}
                            })
                        }
                    });
                }
                oBtnControl.addDependent(this.oMP);
                setTimeout(
                    function () {
                        this.oMP.openBy(oBtnControl);
                    }.bind(this),
                    100
                );
            },
            isPositionable: function (sControlId) {
                return !!(sControlId && sControlId.length > 0);
            }
        });
    }
);