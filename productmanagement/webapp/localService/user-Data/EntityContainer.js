module.exports = {
    executeAction: function(actionDefinition, actionData, keys, odataRequest) {
        switch (actionDefinition.name) {
            case 'getCurrentUser':
                return {
                    "ID": "76446e6a-bbb5-4d29-97f8-f2736e7870e1",
                    "createdAt": "2024-07-17T08:45:35.250540100Z",
                    "createdBy": "A0067600@kiongroup.com",
                    "modifiedAt": "2024-07-23T05:11:55.752758500Z",
                    "modifiedBy": "A0067600@kiongroup.com",
                    "code": "12121",
                    "brand": "LMH",
                    "description": "223",
                    "roles": ["openid", "SDR_Admins", "uaa.user"]
                };
            case 'baseFunction':
                if (odataRequest.isStrictMode) {
                    return `STRICT :: ${actionData.data}`;
                }
                return actionData.data;
            default:
                this.throwError('Not implemented', 501, {
                    error: {
                        message: `FunctionImport or Action "${actionDefinition.name}" not mocked`
                    }
                });
        }
    }
};