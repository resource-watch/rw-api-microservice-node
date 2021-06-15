import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import type { Context, Middleware, Next } from "koa";
import cors from "@koa/cors";
import compose from "koa-compose";
import type corsType from "@koa/cors";
import type request from "request";
import type Logger from "bunyan";
// @ts-ignore
import Fastly from 'fastly-promises';

import { ResponseError } from "./response.error";

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
}

export interface ConfigurationOptions extends BootstrapArguments {
    fastlyEnabled: boolean;
}

export interface RequestToMicroserviceOptions {
    version?: string & boolean;
    application?: string;
    simple?: boolean;
    resolveWithFullResponse?: boolean;
}

class Microservice implements IRWAPIMicroservice {
    public options: ConfigurationOptions;

    private static convertAndValidateBootstrapOptions(options: BootstrapArguments): ConfigurationOptions {
        if (
            options.fastlyEnabled !== true
            && options.fastlyEnabled !== false
            && options.fastlyEnabled !== "true"
            && options.fastlyEnabled !== "false"
        ) {
            throw new Error('RW API microservice - "fastlyEnabled" needs to be a boolean');
        }

        const convertedOptions: ConfigurationOptions = {
            ...options,
            fastlyEnabled: (options.fastlyEnabled === true || options.fastlyEnabled === "true")
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

        return convertedOptions;
    }

    private static async fastlyIntegrationHandler(ctx: Context, fastlyServiceId: string, fastlyAPIKey: string, logger: Logger): Promise<void> {
        const fastly: Fastly = Fastly(fastlyAPIKey, fastlyServiceId);

        if (ctx.status >= 200 && ctx.status < 400) {
            // Non-GET, anonymous requests with the `uncache` header can purge the cache
            if (ctx.request.method !== 'GET' && ctx.response.headers && ctx?.response?.headers?.uncache) {
                let tags: string[] = ctx.response.headers.uncache;
                if (typeof ctx.response.headers.uncache === "string") {
                    tags = ctx.response.headers.uncache.split(' ').filter((part: string) => part !== '');
                }
                logger.info('[fastlyIntegrationHandler] Purging cache for tag(s): ', tags.join(' '));
                await fastly.purgeKeys(tags);
            }

            // GET anonymous requests with the `cache` header can be cached
            if (ctx.request.method === 'GET' && !ctx.request.headers?.authorization && ctx.response?.headers?.cache) {
                let keys: string | string[] = ctx.response.headers.cache;
                if (Array.isArray(ctx.response.headers.cache)) {
                    keys = ctx.response.headers.cache.join(' ');
                }
                logger.info('[fastlyIntegrationHandler] Caching with key(s): ', keys);
                ctx.set('Surrogate-Key', keys);
            } else {
                ctx.set('Cache-Control', 'private');
            }
        }
    }

    private async getLoggedUser(logger: Logger, baseURL: string, ctx: Context): Promise<void> {
        logger.debug('[getLoggedUser] Obtaining loggedUser for microserviceToken');
        if (!ctx.request.header.authorization) {
            logger.debug('[getLoggedUser] No authorization header found, returning');
            return;
        }

        try {
            const getUserDetailsRequestConfig: AxiosRequestConfig = {
                method: 'GET',
                baseURL,
                url: `/auth/user/me`,
                headers: {
                    'authorization': ctx.request.header.authorization
                }
            };

            const response: AxiosResponse<Record<string, any>> = await axios(getUserDetailsRequestConfig);

            logger.debug('[getLoggedUser] Retrieved microserviceToken data, response status:', response.status);

            if (['GET', 'DELETE'].includes(ctx.request.method.toUpperCase())) {
                ctx.request.query = { ...ctx.request.query, loggedUser: JSON.stringify(response.data) };
            } else if (['POST', 'PATCH', 'PUT'].includes(ctx.request.method.toUpperCase())) {
                // @ts-ignore
                ctx.request.body.loggedUser = response.data;
            }
        } catch (err) {
            this.options.logger.error('Error getting user data', err);
            if (err?.response?.data) {
                throw new ResponseError(err.response.status, err.response.data, err.response);
            }
            throw err;
        }
    }

    public bootstrap(opts: BootstrapArguments): Middleware<{}, {}> {
        this.options = Microservice.convertAndValidateBootstrapOptions(opts);

        this.options.logger.info('RW API integration middleware registered');

        const corsOptions: corsType.Options = {
            credentials: true,
            allowHeaders: 'upgrade-insecure-requests'
        };

        const bootstrapMiddleware:Middleware = async (ctx: Context, next: Next) => {

            const { logger, gatewayURL } = this.options;

            try {
                await this.getLoggedUser(logger, gatewayURL, ctx);
            } catch (getLoggedUserError) {
                if (getLoggedUserError instanceof ResponseError) {
                    ctx.response.status = (getLoggedUserError as ResponseError).statusCode;
                    ctx.response.body = (getLoggedUserError as ResponseError).error;
                    return;
                } else {
                    ctx.throw(500, `Error loading user info from token - ${getLoggedUserError.toString()}`);
                }
            }
            await next();

            if (this.options.fastlyEnabled) {
                await Microservice.fastlyIntegrationHandler(ctx, this.options.fastlyServiceId, this.options.fastlyAPIKey, logger);
            }

        };

        return compose([cors(corsOptions), bootstrapMiddleware]);
    }

    public async requestToMicroservice(requestConfig: request.OptionsWithUri & RequestToMicroserviceOptions): Promise<Record<string, any>> {
        this.options.logger.info('Adding authorization header');
        const axiosRequestConfig: AxiosRequestConfig = {
            baseURL: this.options.gatewayURL,
            data: requestConfig.body,
            // @ts-ignore
            method: requestConfig.method
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
