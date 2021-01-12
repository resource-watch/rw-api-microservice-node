import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import type { Context, Middleware, Next } from "koa";
import type request from "request";
import type Logger from "bunyan";
// @ts-ignore
import Fastly from 'fastly-promises';

import { ResponseError } from "./response.error";

export interface IRWAPIMicroservice {
    register: () => Promise<any>;
    requestToMicroservice: (config: request.OptionsWithUri & RequestToMicroserviceOptions) => Promise<Record<string, any>>;
    bootstrap: (opts: RegisterOptions) => Middleware<{}, {}>;
}

export interface RegisterOptions {
    info: Record<string, any>;
    swagger: Record<string, any>;
    logger: Logger;
    name: string;
    baseURL: string;
    url: string;
    token: string;
    skipGetLoggedUser?: boolean;
    fastlyServiceId?: string;
    fastlyAPIKey?: string;
}

export interface RequestToMicroserviceOptions {
    version?: string & boolean;
    application?: string;
    simple?: boolean;
    resolveWithFullResponse?: boolean;
}

class Microservice implements IRWAPIMicroservice {
    public options: RegisterOptions & { skipGetLoggedUser: boolean };

    private static validateBootstrapOptions(options: RegisterOptions): void {
        if (!options.info) {
            throw new Error('RW API microservice - "info" cannot be empty');
        }
        if (!options.swagger) {
            throw new Error('RW API microservice - "swagger" cannot be empty');
        }
        if (!options.logger) {
            throw new Error('RW API microservice - "logger" cannot be empty');
        }
        if (!options.name) {
            throw new Error('RW API microservice - "name" cannot be empty');
        }
        if (!options.baseURL) {
            throw new Error('RW API microservice - "baseURL" cannot be empty');
        }
        if (!options.url) {
            throw new Error('RW API microservice - "url" cannot be empty');
        }
        if (!options.token) {
            throw new Error('RW API microservice - "token" cannot be empty');
        }
    }

    private static async fastlyIntegrationHandler(ctx: Context, fastlyServiceId: string, fastlyAPIKey: string, logger: Logger): Promise<void> {
        const fastly: Fastly = Fastly(fastlyAPIKey, fastlyServiceId);

        if (ctx.status >= 200 && ctx.status < 400) {
            // Non-GET, anonymous requests with the `uncache` header can purge the cache
            if (ctx.request.method !== 'GET' && ctx.response.headers && ctx.response.headers.uncache) {
                const tags: string[] = ctx.response.headers.uncache.split(' ').filter((part: string) => part !== '');
                logger.info('[fastlyIntegrationHandler] Purging cache for tag(s): ', tags.join(' '));
                await fastly.purgeKeys(tags);
            }

            // GET anonymous requests with the `cache` header can be cached
            if (ctx.request.method === 'GET' && !ctx.request.headers?.authorization && ctx.response?.headers?.cache) {
                const key: string = ctx.response.headers.cache.split(' ').filter((part: string) => part !== '').join(' ');
                logger.info('[fastlyIntegrationHandler] Caching with key(s): ', key);
                ctx.set('Surrogate-Key', key);
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
                ctx.request.query.loggedUser = JSON.stringify(response.data);
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

    public bootstrap(opts: RegisterOptions): Middleware<{}, {}> {
        this.options = {
            ...opts,
            skipGetLoggedUser: ('skipGetLoggedUser' in opts) ? opts.skipGetLoggedUser : false
        };
        this.options.logger.info('RW API integration middleware registered');

        Microservice.validateBootstrapOptions(opts);

        return async (ctx: Context, next: Next) => {
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
            if (!opts.skipGetLoggedUser) {
                try {
                    await this.getLoggedUser(logger, baseURL, ctx);
                } catch (getLoggedUserError) {
                    ctx.throw(500, `Error loading user info from token - ${getLoggedUserError.toString()}`);
                }
            }
            await next();

            if (opts.fastlyAPIKey && opts.fastlyServiceId) {
                await Microservice.fastlyIntegrationHandler(ctx, opts.fastlyServiceId, opts.fastlyAPIKey, logger);
            }
        };
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

            axiosRequestConfig.headers = Object.assign(requestConfig.headers || {}, { authentication: this.options.token });
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
