import nock from "nock";
import constants from "./test.constants";

export const mockValidateRequest: (user?: any, token?: string, apiKey?: string) => void = (user = constants.USER, token = constants.USER_TOKEN, apiKey = null) => {
    const body: Record<string, any> = {
        userToken: `Bearer ${token}`
    };

    if (apiKey) {
        body.apiKey = apiKey;
    }

    nock('https://controltower.dev', {
        reqheaders: {
            authorization: `Bearer ${constants.MICROSERVICE_TOKEN}`,
        }
    })
        .post('/api/v1/request/validate', body)
        .reply(200, {
            user
        });
};


export const mockValidateRequestWithApiKey: (user?: any, token?: string) => void = (user = constants.USER, token = constants.USER_TOKEN) => {
    mockValidateRequest(user, token, 'api-key-test');
};
