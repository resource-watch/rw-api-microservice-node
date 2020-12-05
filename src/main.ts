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
        if (!ctx.request.header.authorization) {
            return;
        }

        logger.info('Obtaining loggedUser for token');

        const getUserDetailsRequestConfig: AxiosRequestConfig = {
            method: 'GET',
            baseURL,
            url: `/auth/user/me`,
            headers: {
                'authorization': ctx.request.header.authorization
            }
        };

        const response: AxiosResponse<Record<string, any>> = await axios(getUserDetailsRequestConfig);

        if (['GET', 'DELETE'].includes(ctx.request.method.toUpperCase())) {
            ctx.request.query.loggedUser = JSON.stringify(response.data);
        } else if (['POST', 'PATCH', 'PUT'].includes(ctx.request.method.toUpperCase())) {
            // @ts-ignore
            ctx.request.body.loggedUser = response.data;
        }
    }

    public bootstrap(opts: RegisterOptions): Middleware<{}, {}> {
        this.options = opts;

        return async (ctx: Context, next: Next) => {
            const { logger, baseURL, info, swagger } = this.options;

            this.options.logger.info('Initializing register microservice');

            await this.getLoggedUser(logger, baseURL, ctx);
            this.registerCTRoutes(info, swagger, logger, ctx);

            return next();
        };
    }

    public async register(): Promise<Record<string, any>> {
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
