// @ts-ignore
import Fastly from '@tiagojsag/fastly-promises';
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import type { Context, Middleware, Next, Request } from "koa";
import cors from "@koa/cors";
import compose from "koa-compose";
import type corsType from "@koa/cors";
import type Logger from "bunyan";
import { ResponseError } from "./errors/response.error";
import { ApiKeyError } from "./errors/apiKey.error";
import CloudWatchService from "./cloudwatch.service";
import {
    BootstrapArguments,
    ConfigurationOptions,
    IRWAPIMicroservice, MicroserviceValidationResponse,
    RequestToMicroserviceOptions,
    RequestValidationResponse, UserValidationResponse
} from "./types";

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
            fastlyEnabled: (options.fastlyEnabled === true || options.fastlyEnabled === "true"),
            requireAPIKey: !(options.requireAPIKey === false || options.requireAPIKey === "false"),
            skipAPIKeyRequirementEndpoints: (options.skipAPIKeyRequirementEndpoints || []).concat(
                [{
                    method: 'GET',
                    pathRegex: '/healthcheck'
                }, {
                    method: 'POST',
                    pathRegex: '/api/v1/request/validate'
                }]),
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
        if (!request.header["x-api-key"] && this.options.requireAPIKey) {
            throw new ApiKeyError(403, 'Required API key not found');
        }

        try {
            const body: Record<string, any> = {};

            if (request.header.authorization) {
                body.userToken = request.header.authorization;
            }

            if (request.header["x-api-key"]) {
                body.apiKey = request.header["x-api-key"];
            }

            if (Object.keys(body).length > 0) {
                const getUserDetailsRequestConfig: AxiosRequestConfig = {
                    method: 'POST',
                    baseURL,
                    url: `/v1/request/validate`,
                    headers: {
                        'authorization': `Bearer ${this.options.microserviceToken}`
                    },
                    data: body
                };
                const response: AxiosResponse<Record<string, any>> = await axios(getUserDetailsRequestConfig);

                logger.debug('[getLoggedUser] Retrieved microserviceToken data, response status:', response.status);

                return response.data as RequestValidationResponse;
            } else {
                return {};
            }


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

    private async logRequestToCloudWatch(logger: Logger, request: Request, requestValidationData: RequestValidationResponse): Promise<void> {
        logger.debug('[logRequestToCloudWatch] Logging request to CloudWatch');

        const logQuery: Record<string, any> = { ...request.query };
        delete logQuery.loggedUser;
        delete logQuery.requestApplication;
        const logContent: Record<string, any> = {
            request: {
                method: request.method,
                path: request.path,
                query: logQuery,
            }
        };
        if (requestValidationData.user) {
            if (requestValidationData.user.id === 'microservice') {
                logContent.loggedUser = {
                    id: (requestValidationData.user as MicroserviceValidationResponse).id,
                };
            } else {
                logContent.loggedUser = {
                    id: (requestValidationData.user as UserValidationResponse).id,
                    name: (requestValidationData.user as UserValidationResponse).name,
                    role: (requestValidationData.user as UserValidationResponse).role,
                    provider: (requestValidationData.user as UserValidationResponse).provider
                };
            }
        } else {
            logContent.loggedUser = {
                id: 'anonymous',
                name: 'anonymous',
                role: 'anonymous',
                provider: 'anonymous'
            };
        }
        if (requestValidationData.application) {
            logContent.requestApplication = {...requestValidationData.application.data, ...requestValidationData.application.data.attributes};
            delete logContent.requestApplication.attributes;
            delete logContent.requestApplication.type;
            delete logContent.requestApplication.createdAt;
            delete logContent.requestApplication.updatedAt;
        } else {
            logContent.requestApplication = {
                id: 'anonymous',
                name: 'anonymous',
                organization: null,
                user: null,
                apiKeyValue: null,
            };
        }

        await this.cloudWatchService.logToCloudWatch(JSON.stringify(logContent));
    }

    private shouldSkipAPIKeyValidation(ctx: Context): boolean {
        for (const skipAPIKeyRequirementEndpoint of this.options.skipAPIKeyRequirementEndpoints) {
            if (ctx.request.path.match(skipAPIKeyRequirementEndpoint.pathRegex) && ctx.request.method === skipAPIKeyRequirementEndpoint.method) {
                return true;
            }
        }
        return false;
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

            if (!this.shouldSkipAPIKeyValidation(ctx)) {
                try {
                    const requestValidationData: RequestValidationResponse = await this.getRequestValidationData(logger, gatewayURL, ctx.request);
                    await this.injectRequestValidationData(logger, requestValidationData, ctx.request);
                    if (this.options.awsCloudWatchLoggingEnabled) {
                        await this.logRequestToCloudWatch(logger, ctx.request, requestValidationData);
                    }
                } catch (getLoggedUserError) {
                    if (getLoggedUserError instanceof ResponseError) {
                        ctx.response.status = (getLoggedUserError as ResponseError).statusCode;
                        ctx.response.body = (getLoggedUserError as ResponseError).error;
                        return;
                    } else if (getLoggedUserError instanceof ApiKeyError) {
                        ctx.response.status = (getLoggedUserError as ResponseError).statusCode;
                        ctx.response.body = {
                            errors: [{
                                status: 401,
                                detail: (getLoggedUserError as ResponseError).message
                            }]
                        };
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
            if (this.options.requireAPIKey && !axiosRequestConfig.headers.api_key) {
                throw new ApiKeyError(403, 'API key required when making requests to other microservices');
            }

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
