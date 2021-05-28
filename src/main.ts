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
    register: () => Promise<any>;
    requestToMicroservice: (config: request.OptionsWithUri & RequestToMicroserviceOptions) => Promise<Record<string, any>>;
    bootstrap: (opts: BootstrapArguments) => Middleware<{}, {}>;
}

export interface BootstrapArguments {
    info: Record<string, any>;
    swagger: Record<string, any>;
    logger: Logger;
    name: string;
    baseURL: string;
    url: string;
    token: string;
    skipGetLoggedUser?: boolean;
    fastlyEnabled: boolean | "true" | "false";
    fastlyServiceId?: string;
    fastlyAPIKey?: string;
}

export interface ConfigurationOptions extends BootstrapArguments {
    skipGetLoggedUser: boolean;
    fastlyEnabled: boolean;
}

export interface RequestToMicroserviceOptions {
    version?: string & boolean;
    application?: string;
    simple?: boolean;
    resolveWithFullResponse?: boolean;
}

class Microservice implements IRWAPIMicroservice {
    public options: ConfigurationOptions & { skipGetLoggedUser: boolean };

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
            skipGetLoggedUser: ('skipGetLoggedUser' in options) ? options.skipGetLoggedUser : false,
            fastlyEnabled: (options.fastlyEnabled === true || options.fastlyEnabled === "true")
        };

        if (!convertedOptions.info) {
            throw new Error('RW API microservice - "info" cannot be empty');
        }
        if (!convertedOptions.swagger) {
            throw new Error('RW API microservice - "swagger" cannot be empty');
        }
        if (!convertedOptions.logger) {
            throw new Error('RW API microservice - "logger" cannot be empty');
        }
        if (!convertedOptions.name) {
            throw new Error('RW API microservice - "name" cannot be empty');
        }
        if (!convertedOptions.baseURL) {
            throw new Error('RW API microservice - "baseURL" cannot be empty');
        }
        if (!convertedOptions.url) {
            throw new Error('RW API microservice - "url" cannot be empty');
        }
        if (!convertedOptions.token) {
            throw new Error('RW API microservice - "token" cannot be empty');
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

    private static registerCTRoutes(info: Record<string, any>, swagger: Record<string, any>, logger: Logger, ctx: Context): void {
        if (ctx.path === '/info') {
            logger.info('Obtaining info to register microservice');
            info.swagger = swagger;
            ctx.body = info;
        } else if (ctx.path === '/ping') {
            ctx.body = 'pong';
        }
    }

    private async getLoggedUser(logger: Logger, baseURL: string, ctx: Context): Promise<void> {
        logger.debug('[getLoggedUser] Obtaining loggedUser for token');
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

            logger.debug('[getLoggedUser] Retrieved token data, response status:', response.status);

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
            credentials: true
        };

        const bootstrapMiddleware:Middleware = async (ctx: Context, next: Next) => {

            const { logger, baseURL, info, swagger } = this.options;

            Microservice.registerCTRoutes(info, swagger, logger, ctx);

            /**
             * This is a temporary hack to allow this library to be used with the Authorization
             * Microservice without resulting in an endless loop. It allows the Authorization MS
             * to register in CT for route publishing, while not causing requests with token to generate
             * an endless loop.
             *
             * Once the Authorization MS is working without being registered in CT, the surrounding
             * `if` statement can be safely removed, as well as all references to skipGetLoggedUser
             */
            if (!this.options.skipGetLoggedUser) {
                try {
                    await this.getLoggedUser(logger, baseURL, ctx);
                } catch (getLoggedUserError) {
                    if (getLoggedUserError instanceof ResponseError) {
                        ctx.response.status = (getLoggedUserError as ResponseError).statusCode;
                        ctx.response.body = (getLoggedUserError as ResponseError).error;
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

    public async register(): Promise<Record<string, any>> {
        this.options.logger.info('Starting CT registration process');

        const response: AxiosResponse<Record<string, any>> = await axios({
            baseURL: this.options.baseURL,
            url: `/api/v1/microservice`,
            data: {
                name: this.options.name,
                url: this.options.url,
                active: true,
            },
            method: 'POST',
        });

        this.options.logger.debug('[register] Registration response status:', response.status);

        return response.data;
    }

    public async requestToMicroservice(requestConfig: request.OptionsWithUri & RequestToMicroserviceOptions): Promise<Record<string, any>> {
        this.options.logger.info('Adding authorization header');
        const axiosRequestConfig: AxiosRequestConfig = {
            baseURL: this.options.baseURL,
            data: requestConfig.body,
            // @ts-ignore
            method: requestConfig.method
        };

        try {
            let version: string = '';

            if (process.env.API_VERSION && requestConfig.version !== false) {
                version = `/${process.env.API_VERSION}`;
            }

            axiosRequestConfig.url = version + requestConfig.uri;

            axiosRequestConfig.headers = Object.assign(requestConfig.headers || {}, { authorization: `Bearer ${this.options.token}` });
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
