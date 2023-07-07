// @ts-ignore
import Fastly from '@tiagojsag/fastly-promises';
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import type { Context, Middleware, Next, Request } from "koa";
import cors from "@koa/cors";
import compose from "koa-compose";
import type corsType from "@koa/cors";
import type request from "request";
import type Logger from "bunyan";
import { Headers } from 'request';
import { Url } from 'url';
import { ResponseError } from "errors/response.error";
import { ApiKeyError } from "errors/apiKey.error";
import CloudWatchService from "./cloudwatch.service";

export interface IRWAPIMicroservice {
    requestToMicroservice: (config: request.OptionsWithUri & RequestToMicroserviceOptions) => Promise<Record<string, any>>;
    bootstrap: (opts: BootstrapArguments) => Middleware<{}, {}>;
}

export interface BootstrapArguments {
    logger: Logger;
    gatewayURL: string;
    microserviceToken: string;
    skipGetLoggedUser?: boolean;
    fastlyEnabled: boolean | "true" | "false";
    fastlyServiceId?: string;
    fastlyAPIKey?: string;
    requireAPIKey?: boolean | "true" | "false";
    awsCloudWatchLoggingEnabled?: boolean | "true" | "false";
    awsRegion?: string;
    awsCloudWatchLogGroupName?: string;
    awsCloudWatchLogStreamName?: string;
}

export interface ConfigurationOptions extends BootstrapArguments {
    skipGetLoggedUser: boolean;
    fastlyEnabled: boolean;
    requireAPIKey: boolean;
    awsCloudWatchLoggingEnabled?: boolean;

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

interface RequestValidationResponse {
    user?: {
        id: string,
        name: string,
        role: string,
        provider: string,
        email: string,
        extraUserData: Record<string, any>
    },
    application?: {
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
}

class Microservice implements IRWAPIMicroservice {
    public options: ConfigurationOptions;

    private cloudWatchService: CloudWatchService;

    private static convertAndValidateBootstrapOptions(options: BootstrapArguments): ConfigurationOptions {
        if (
            options.fastlyEnabled !== true
            && options.fastlyEnabled !== false
            && options.fastlyEnabled !== "true"
            && options.fastlyEnabled !== "false"
        ) {
            throw new Error('RW API microservice - "fastlyEnabled" needs to be a boolean');
        }

        if (
            options.hasOwnProperty('requireAPIKey')
            && options.requireAPIKey !== true
            && options.requireAPIKey !== false
            && options.requireAPIKey !== "true"
            && options.requireAPIKey !== "false"
        ) {
            throw new Error('RW API microservice - "requireAPIKey" needs to be a boolean');
        }

        if (
            typeof options.awsCloudWatchLoggingEnabled !== 'undefined'
            && options.awsCloudWatchLoggingEnabled !== true
            && options.awsCloudWatchLoggingEnabled !== false
            && options.awsCloudWatchLoggingEnabled !== "true"
            && options.awsCloudWatchLoggingEnabled !== "false"
        ) {
            throw new Error('RW API microservice - "awsCloudWatchLoggingEnabled" needs to be a boolean');
        }

        const convertedOptions: ConfigurationOptions = {
            ...options,
            awsCloudWatchLoggingEnabled: ('awsCloudWatchLoggingEnabled' in options) ? (options.awsCloudWatchLoggingEnabled === true || options.awsCloudWatchLoggingEnabled === "true") : true,
            awsCloudWatchLogGroupName: options.awsCloudWatchLogGroupName || 'api-keys-usage',
            skipGetLoggedUser: ('skipGetLoggedUser' in options) ? options.skipGetLoggedUser : false,
            fastlyEnabled: (options.fastlyEnabled === true || options.fastlyEnabled === "true"),
            requireAPIKey: !(options.requireAPIKey === false || options.requireAPIKey === "false")
        };

        if (!convertedOptions.logger) {
            throw new Error('RW API microservice - "logger" cannot be empty');
        }
        if (!convertedOptions.gatewayURL) {
            throw new Error('RW API microservice - "gatewayURL" cannot be empty');
        }
        if (!convertedOptions.microserviceToken) {
            throw new Error('RW API microservice - "microserviceToken" cannot be empty');
        }
        if (convertedOptions.fastlyEnabled === true) {
            if (!options.fastlyServiceId) {
                throw new Error('RW API microservice - "fastlyServiceId" cannot be empty');
            }
            if (!convertedOptions.fastlyAPIKey) {
                throw new Error('RW API microservice - "fastlyAPIKey" cannot be empty');
            }
        }
        if (convertedOptions.awsCloudWatchLoggingEnabled === true) {
            if (!options.awsRegion) {
                throw new Error('RW API microservice - "awsRegion" cannot be empty');
            }
            if (!convertedOptions.awsCloudWatchLogGroupName) {
                throw new Error('RW API microservice - "awsCloudWatchLogGroupName" cannot be empty');
            }
            if (!convertedOptions.awsCloudWatchLogStreamName) {
                throw new Error('RW API microservice - "awsCloudWatchLogStreamName" cannot be empty');
            }
        }

        return convertedOptions;
    }

    private static async fastlyIntegrationHandler(ctx: Context, fastlyServiceId: string, fastlyAPIKey: string, logger: Logger): Promise<void> {
        const fastly: Fastly = Fastly(fastlyAPIKey, fastlyServiceId);

        if (ctx.status >= 200 && ctx.status < 400) {
            // Non-GET, anonymous requests with the `uncache` header can purge the cache
            if (ctx.request.method !== 'GET' && ctx.response.headers && ctx?.response?.headers?.uncache) {
                let tags: string[];
                if (typeof ctx.response.headers.uncache === "string" || typeof ctx.response.headers.uncache === "number") {
                    tags = ctx.response.headers.uncache.toString().split(' ').filter((part: string) => part !== '');
                } else {
                    tags = ctx.response.headers.uncache;
                }
                logger.info('[fastlyIntegrationHandler] Purging cache for tag(s): ', tags.join(' '));
                await fastly.purgeKeys(tags);
            }

            // GET anonymous requests with the `cache` header can be cached
            if (ctx.request.method === 'GET' && !ctx.request.headers?.authorization && ctx.response?.headers?.cache) {
                let keys: number | string | string[];
                if (Array.isArray(ctx.response.headers.cache)) {
                    keys = ctx.response.headers.cache.join(' ');
                } else {
                    keys = ctx.response.headers.cache.toString();
                }
                logger.info('[fastlyIntegrationHandler] Caching with key(s): ', keys);
                ctx.set('Surrogate-Key', keys);
            } else {
                ctx.set('Cache-Control', 'private');
            }
        }
    }

    private async getRequestValidationData(logger: Logger, baseURL: string, request: Request): Promise<RequestValidationResponse> {
        logger.debug('[getLoggedUser] Obtaining loggedUser for microserviceToken');
        if (!request.header.authorization) {
            logger.debug('[getLoggedUser] No authorization header found');
        }
        if (!request.header["x-api-key"]) {
            logger.debug('[getLoggedUser] No api key header found');
            if (this.options.requireAPIKey && request.header.authorization !== `Bearer ${this.options.microserviceToken}`) {
                throw new ApiKeyError(403, 'Required API key not found');
            }
        }

        try {
            const body: Record<string, any> = {
                userToken: request.header.authorization,
            };

            if (request.header["x-api-key"]) {
                body.apiKey = request.header["x-api-key"];
            }

            const getUserDetailsRequestConfig: AxiosRequestConfig = {
                method: 'POST',
                baseURL,
                url: `/api/v1/request/validate`,
                headers: {
                    'authorization': `Bearer ${this.options.microserviceToken}`
                },
                data: body
            };

            const response: AxiosResponse<Record<string, any>> = await axios(getUserDetailsRequestConfig);

            logger.debug('[getLoggedUser] Retrieved microserviceToken data, response status:', response.status);

            return response.data as RequestValidationResponse;
        } catch (err) {
            this.options.logger.error('Error getting user data', err);
            if (err?.response?.data) {
                throw new ResponseError(err.response.status, err.response.data, err.response);
            }
            throw err;
        }
    }

    private async injectRequestValidationData(logger: Logger, requestValidationData: RequestValidationResponse, request: Request): Promise<void> {
        logger.debug('[injectRequestValidationData] Obtaining loggedUser for microserviceToken');

        if (['GET', 'DELETE'].includes(request.method.toUpperCase())) {
            if (requestValidationData.user) {
                request.query = { ...request.query, loggedUser: JSON.stringify(requestValidationData.user) };
            }
            if (requestValidationData.application) {
                request.query = {
                    ...request.query,
                    requestApplication: JSON.stringify(requestValidationData.application)
                };
            }
        } else if (['POST', 'PATCH', 'PUT'].includes(request.method.toUpperCase())) {
            if (requestValidationData.user) {
                // @ts-ignore
                request.body.loggedUser = requestValidationData.user;
            }
            if (requestValidationData.application) {
                // @ts-ignore
                request.body.requestApplication = requestValidationData.application;
            }
        }
    }

    private async logRequestToCloudWatch(logger: Logger, requestValidationData: RequestValidationResponse): Promise<void> {
        logger.debug('[logRequestToCloudWatch] Logging request to CloudWatch');

        const logContent: Record<string, any> = {};
        if (requestValidationData.user) {
            logContent.loggedUser = {
                id: requestValidationData.user.id,
                name: requestValidationData.user.name,
                role: requestValidationData.user.role,
                provider: requestValidationData.user.provider
            };
        }
        if (requestValidationData.application) {
            logContent.requestApplication = {
                id: requestValidationData.application.data.id,
                name: requestValidationData.application.data.attributes.name,
                organization: requestValidationData.application.data.attributes.organization,
                user: requestValidationData.application.data.attributes.user,
                apiKeyValue: requestValidationData.application.data.attributes.apiKeyValue,
            };
        }

        await this.cloudWatchService.logToCloudWatch(JSON.stringify(logContent));
    }

    public bootstrap(opts: BootstrapArguments): Middleware<{}, {}> {
        this.options = Microservice.convertAndValidateBootstrapOptions(opts);
        this.options.logger.info('RW API integration middleware registered');
        if (this.options.awsCloudWatchLoggingEnabled) {
            this.cloudWatchService = CloudWatchService.init(this.options.logger, this.options.awsRegion, this.options.awsCloudWatchLogGroupName, this.options.awsCloudWatchLogStreamName);
        }

        const corsOptions: corsType.Options = {
            credentials: true,
            allowHeaders: 'upgrade-insecure-requests'
        };

        const bootstrapMiddleware: Middleware = async (ctx: Context, next: Next) => {
            const { logger, gatewayURL } = this.options;

            if (!this.options.skipGetLoggedUser) {
                try {
                    const requestValidationData: RequestValidationResponse = await this.getRequestValidationData(logger, gatewayURL, ctx.request);
                    await this.injectRequestValidationData(logger, requestValidationData, ctx.request);
                    if (this.options.awsCloudWatchLoggingEnabled) {
                        await this.logRequestToCloudWatch(logger, requestValidationData);
                    }
                } catch (getLoggedUserError) {
                    if (getLoggedUserError instanceof ResponseError) {
                        ctx.response.status = (getLoggedUserError as ResponseError).statusCode;
                        ctx.response.body = (getLoggedUserError as ResponseError).error;
                        return;
                    } else if (getLoggedUserError instanceof ApiKeyError) {
                        ctx.response.status = (getLoggedUserError as ResponseError).statusCode;
                        return;
                    } else {
                        ctx.throw(500, `Error loading user info from token - ${getLoggedUserError.toString()}`);
                    }
                }
            }
            await next();

            if (this.options.fastlyEnabled) {
                await Microservice.fastlyIntegrationHandler(ctx, this.options.fastlyServiceId, this.options.fastlyAPIKey, logger);
            }

        };

        return compose([cors(corsOptions), bootstrapMiddleware]);
    }

    public async requestToMicroservice(requestConfig: RequestToMicroserviceOptions): Promise<Record<string, any>> {
        this.options.logger.info('Adding authorization header');
        const axiosRequestConfig: AxiosRequestConfig = {
            baseURL: this.options.gatewayURL,
            data: requestConfig.body,
            // @ts-ignore
            method: requestConfig.method,
            params: requestConfig.params
        };

        try {
            axiosRequestConfig.url = requestConfig.uri.toString();

            axiosRequestConfig.headers = Object.assign(requestConfig.headers || {}, { authorization: `Bearer ${this.options.microserviceToken}` });
            if (requestConfig.application) {
                axiosRequestConfig.headers.app_key = JSON.stringify({ application: requestConfig.application });
            }

            const response: AxiosResponse<Record<string, any>> = await axios(axiosRequestConfig);

            if (requestConfig.resolveWithFullResponse === true) {
                return {
                    statusCode: response.status,
                    body: response.data
                };
            }
            return response.data;
        } catch (err) {
            this.options.logger.info('Error doing request', err);
            if (requestConfig.simple === false && err.response.status < 500) {
                if (requestConfig.resolveWithFullResponse === true) {
                    return {
                        statusCode: err.response.status,
                        body: err.response.data
                    };
                }
                return err.response.data;
            }
            if (err?.response?.data) {
                if (requestConfig.resolveWithFullResponse === true) {
                    return {
                        statusCode: err.response.status,
                        body: err.response.data
                    };
                }
                throw new ResponseError(err.response.status, err.response.data, err.response);
            }
            return err;
        }

    }

}

const microservice: Microservice = new Microservice();

export { microservice as RWAPIMicroservice };
