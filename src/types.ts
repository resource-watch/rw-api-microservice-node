import request, { Headers } from "request";
import { Middleware } from "koa";
import Logger from "bunyan";
import { Url } from "url";

export interface IRWAPIMicroservice {
    requestToMicroservice: (config: request.OptionsWithUri & RequestToMicroserviceOptions) => Promise<Record<string, any>>;
    bootstrap: (opts: BootstrapArguments) => Middleware<{}, {}>;
}

export interface BootstrapArguments {
    logger: Logger;
    gatewayURL: string;
    microserviceToken: string;
    fastlyEnabled: boolean | "true" | "false";
    fastlyServiceId?: string;
    fastlyAPIKey?: string;
    requireAPIKey?: boolean | "true" | "false";
    skipAPIKeyRequirementEndpoints?: Endpoint[];
    awsCloudWatchLoggingEnabled?: boolean | "true" | "false";
    awsRegion: string;
    awsCloudWatchLogGroupName?: string;
    awsCloudWatchLogStreamName: string;
}

export type Endpoint = {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    pathRegex: RegExp | string,
}

export interface ConfigurationOptions extends BootstrapArguments {
    fastlyEnabled: boolean;
    requireAPIKey: boolean;
    awsCloudWatchLoggingEnabled: boolean;
    skipAPIKeyRequirementEndpoints: Endpoint[];
}

export interface RequestToMicroserviceOptions {
    version?: string & boolean;
    application?: string;
    simple?: boolean;
    resolveWithFullResponse?: boolean;
    body?: any;
    params?: Record<string, any>;
    headers?: Headers;
    uri: string | Url;
    method?: string;
}

export type UserValidationResponse = {
    id: string,
    name: string,
    role: string,
    provider: string,
    email: string,
    extraUserData: Record<string, any>
}

export type MicroserviceValidationResponse = {
    id: 'microservice',
    createdAt: string,
}

export type LoggedUserValidationResponse = UserValidationResponse | MicroserviceValidationResponse;

export type ApplicationValidationResponse = {
    data: {
        type: string,
        id: string,
        attributes: {
            name: string,
            organization: null | Record<string, any>,
            user: null | Record<string, any>,
            apiKeyValue: string,
            createdAt: string,
            updatedAt: string
        }
    }
}

export interface RequestValidationResponse {
    user?: LoggedUserValidationResponse,
    application?: ApplicationValidationResponse
}
