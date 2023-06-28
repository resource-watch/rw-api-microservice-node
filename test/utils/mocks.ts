import nock from "nock";
import constants from "./test.constants";

type mockValidateRequestArgType = {
    user?: Record<string, any>,
    application?: Record<string, any>,
    token?: string,
    apiKey?: string,
}

const mockValidateRequest = ({
                                 user = null,
                                 application = null,
                                 token = null,
                                 apiKey = null
                             }: mockValidateRequestArgType): void => {
    const body: Record<string, any> = {};
    const response: Record<string, any> = {};

    if (user) {
        response.user = user;
    }
    if (application) {
        response.application = application;
    }
    if (token) {
        body.userToken = `Bearer ${token}`;
    }
    if (apiKey) {
        body.apiKey = apiKey;
    }

    nock('https://controltower.dev', {
        reqheaders: {
            authorization: `Bearer ${constants.MICROSERVICE_TOKEN}`,
        }
    })
        .post('/api/v1/request/validate', body)
        .reply(200, { user, application });
};


export const mockValidateRequestWithUserToken = (user = constants.USER, token = constants.USER_TOKEN): void => {
    mockValidateRequest({ user, token });
};

export const mockValidateRequestWithApiKey = (apiKey = 'api-key-test', application = constants.APPLICATION): void => {
    mockValidateRequest({ apiKey, application });
};


export const mockValidateRequestWithApiKeyAndUserToken = (apiKey = 'api-key-test', token = constants.USER_TOKEN, application = constants.APPLICATION, user = constants.USER): void => {
    mockValidateRequest({ apiKey, application, user, token });
};
