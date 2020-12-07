import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import type { Context, Middleware, Next } from "koa";
import type request from "request";
import type Logger from "bunyan";
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
}

export interface RequestToMicroserviceOptions {
    version?: string & boolean;
    application?: string;
}

class Microservice implements IRWAPIMicroservice {
    public options: RegisterOptions;

    private validateBootstrapOptions(options:RegisterOptions):void {
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

    private registerCTRoutes(info: Record<string, any>, swagger: Record<string, any>, logger: Logger, ctx: Context): void {
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
    }

    public bootstrap(opts: RegisterOptions): Middleware<{}, {}> {
        this.options = opts;
        this.options.logger.info('RW API integration middleware registered');

        this.validateBootstrapOptions(opts);

        return async (ctx: Context, next: Next) => {
            const { logger, baseURL, info, swagger } = this.options;

            await this.getLoggedUser(logger, baseURL, ctx);
            this.registerCTRoutes(info, swagger, logger, ctx);

            return next();
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
        this.options.logger.info('Adding authentication header');
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
            return response.data;
        } catch (err) {
            this.options.logger.error('Error to doing request', err);
            if (err?.response?.data) {
                throw new ResponseError(err.response.status, err.response.data, err.response);
            }
            return err;
        }

    }

}

const microservice: Microservice = new Microservice();

export { microservice as RWAPIMicroservice };
