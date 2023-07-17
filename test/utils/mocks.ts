import { mockValidateRequest, mockValidateRequestArgType } from "../../src/test-mocks";
import constants from "./test.constants";
import { ApplicationValidationResponse, LoggedUserValidationResponse } from "../../src/types";

export const mockValidateRequestWithUserToken = (gatewayUrl: string, user: LoggedUserValidationResponse = constants.USER, token: string = constants.USER_TOKEN): void => {
    mockValidateRequest({ gatewayUrl, microserviceToken: constants.MICROSERVICE_TOKEN, user, token });
};

export const mockValidateRequestWithApiKey = (gatewayUrl: string, apiKey: string = 'api-key-test', application: ApplicationValidationResponse = constants.APPLICATION): void => {
    mockValidateRequest({ gatewayUrl, microserviceToken: constants.MICROSERVICE_TOKEN, apiKey, application });
};

export const mockValidateRequestWithApiKeyAndUserToken = (
    {
        gatewayUrl,
        apiKey = 'api-key-test',
        token = constants.USER_TOKEN,
        application = constants.APPLICATION,
        user = constants.USER
    }: {
        gatewayUrl:string,
        apiKey?: string,
        token?: string,
        application?: ApplicationValidationResponse,
        user?: LoggedUserValidationResponse
    }): void => {
    mockValidateRequest({
        gatewayUrl,
        microserviceToken: constants.MICROSERVICE_TOKEN,
        apiKey,
        application,
        user,
        token
    });
};
