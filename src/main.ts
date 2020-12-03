import convert from 'koa-convert';
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import type { Context, Next } from "koa";
import type { RegisterOptions, RequestToMicroserviceOptions, RWAPIMicroservice } from 'types';
import type request from "request";
import type Logger from "bunyan";

/**
 * @deprecated Koa1 support will be removed soon
 */
const KOA1: 'KOA1' = 'KOA1';
const KOA2: 'KOA2' = 'KOA2';
/**
 * @deprecated
 */
const EXPRESS: 'EXPRESS' = 'EXPRESS';
/**
 * @deprecated
 */
const MODE_AUTOREGISTER: 'MODE_AUTOREGISTER' = 'MODE_AUTOREGISTER';
/**
 * @deprecated
 */
const MODE_NORMAL: 'MODE_NORMAL' = 'MODE_NORMAL';

class Microservice implements RWAPIMicroservice {
    public options: RegisterOptions;
    public KOA1: 'KOA1' = KOA1;
    public KOA2: 'KOA2' = KOA2;
    public EXPRESS: 'EXPRESS' = EXPRESS;
    public MODE_AUTOREGISTER: 'MODE_AUTOREGISTER' = MODE_AUTOREGISTER;
    public MODE_NORMAL: 'MODE_NORMAL' = MODE_NORMAL;

    private async registerOnCT(name: string, url: string, baseURL: string): Promise<Record<string, any>> {
        const response: AxiosResponse<Record<string, any>> = await axios({
            baseURL,
            url: `/api/v1/microservice`,
            data: {
                name,
                url,
                active: true,
            },
            method: 'POST',
        });
        return response.data;
    }

    private registerCTRoutesMiddleware(info: Record<string, any>, swagger: Record<string, any>, logger: Logger): (ctx: Context, next: Next) => Promise<void> {
        return async (ctx: Context, next: Next) => {
            if (ctx.path === '/info') {
                logger.info('Obtaining info to register microservice');
                info.swagger = swagger;
                ctx.body = info;
                return;
            } else if (ctx.path === '/ping') {
                ctx.body = 'pong';
                return;
            }
            await next();
        };
    }

    private getLoggedUserMiddleware(logger: Logger, baseURL: string): (ctx: Context, next: Next) => Promise<void> {
        return async (ctx: Context, next: Next) => {
            if (!ctx.request.header.authorization) {
                await next();
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

            await next();
        };
    }

    public async register(opts: RegisterOptions): Promise<any> {
        this.options = opts;

        const { app, logger, baseURL, info, swagger, mode } = this.options;

        this.options.logger.info('Initializing register microservice');
        switch (opts.framework) {

            case KOA1:
                // @ts-ignore
                app.use(convert.back(this.getLoggedUserMiddleware(logger, baseURL)));
                // @ts-ignore
                app.use(convert.back(this.registerCTRoutesMiddleware(info, swagger, logger)));
                break;
            case KOA2:
                app.use(this.getLoggedUserMiddleware(logger, baseURL));
                app.use(this.registerCTRoutesMiddleware(info, swagger, logger));
                break;
            default:
                throw new Error('Unsupported framework');
        }

        logger.debug('Checking mode');

        if (mode === MODE_AUTOREGISTER) {
            try {
                await this.registerOnCT(opts.name, opts.url, baseURL);
                logger.debug('Register microservice complete successfully!');
            } catch (error) {
                logger.error('Error registering', error);
            }

        }
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
            throw err;
        }

    }

}

const microservice: Microservice = new Microservice();

export { microservice };
