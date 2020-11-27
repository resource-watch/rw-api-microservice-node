import requestPromise from 'request-promise';
import RegisterService from 'register.service';
import convert from 'koa-convert';
import type RWAPIMicroservice from '../types';
import { Context, Next } from "koa";
import type request from "request";
import axios, { AxiosRequestConfig } from "axios";

const KOA1 = 'KOA1';
const KOA2 = 'KOA2';
const EXPRESS = 'EXPRESS';
const MODE_AUTOREGISTER = 'MODE_AUTOREGISTER';
const MODE_NORMAL = 'MODE_NORMAL';

class Microservice implements RWAPIMicroservice.RWAPIMicroservice {
    public options: RWAPIMicroservice.RegisterOptions;
    public KOA1: string = KOA1;
    public KOA2: string = KOA1;
    public EXPRESS: string = EXPRESS;
    public MODE_AUTOREGISTER: string = MODE_AUTOREGISTER;
    public MODE_NORMAL: string = MODE_NORMAL;

    private async registerCTRoutes(ctx: Context, info: Record<string, any>, swagger: Record<string, any>, next: Next) {
        if (ctx.path === '/info') {
            this.options.logger.info('Obtaining info to register microservice');
            info.swagger = swagger;
            // save token and url
            ctx.body = info;
            return;
        } else if (ctx.path === '/ping') {
            ctx.body = 'pong';
            return;
        }
        await next();
    }

    private async getLoggedUser(ctx: Context, next: Next) {
        if (!ctx.request.header.authorization) {
            await next();
            return
        }

        this.options.logger.info('Obtaining loggedUser for token');

        const getUserDetailsRequestConfig: AxiosRequestConfig = {
            method: 'GET',
            url: `${this.options.ctUrl}/auth/user/me`,
            headers: {
                'authorization': ctx.request.header.authorization
            }
        };

        const response = await axios(getUserDetailsRequestConfig);

        if (['GET', 'DELETE'].includes(ctx.request.method.toUpperCase())) {
            ctx.request.query.loggedUser = JSON.stringify(response.data);
        } else if (['POST', 'PATCH', 'PUT'].includes(ctx.request.method.toUpperCase())) {
            ctx.request.body.loggedUser = response.data;
        }
        ;

        await next();
    }

    public register(opts: RWAPIMicroservice.RegisterOptions): Promise<any> {
        if (opts) {
            this.options = opts;
        }

        return new Promise((resolve, reject) => {
            this.options.logger.info('Initializing register microservice');
            const ctxLib = this;
            switch (opts.framework) {

                case KOA1:
                    // @ts-ignore
                    opts.app.use(convert.back(async (ctx: Context, next: Next) => {
                        this.options.logger.info('Entering with path', ctx.path);
                        await ctxLib.getLoggedUser(ctx, next);
                    }));

                    // @ts-ignore
                    opts.app.use(convert.back(async (ctx: Context, next: Next) => {
                        this.options.logger.info('Entering with path', ctx.path);
                        await ctxLib.registerCTRoutes(ctx, opts.info, opts.swagger, next);
                    }));
                    break;
                case KOA2:
                    opts.app.use(async (ctx: Context, next: Next) => {
                        this.options.logger.info('Entering with path', ctx.path);
                        await ctxLib.getLoggedUser(ctx, next);
                    });
                    opts.app.use(async (ctx: Context, next: Next) => {
                        this.options.logger.info('Entering with path', ctx.path);
                        await ctxLib.registerCTRoutes(ctx, opts.info, opts.swagger, next);
                    });
                    break;
                default:

            }

            this.options.logger.debug('Checking mode');
            switch (opts.mode) {

                case MODE_AUTOREGISTER:
                    RegisterService.register(opts.name, opts.url, opts.active, opts.ctUrl)
                        .then(() => {
                            this.options.logger.debug('Register microservice complete successfully!');
                            resolve(null);
                        }, (err) => {
                            this.options.logger.error('Error registering', err);
                            reject(err);
                        });
                    break;
                default:
                    this.options.logger.debug('Register microservice complete successfully!');
                    resolve(null);
            }
        });
    }

    public requestToMicroservice(config: request.OptionsWithUri & RWAPIMicroservice.RequestToMicroserviceOptions): request.Request {
        this.options.logger.info('Adding authentication header ');
        try {
            let version = '';
            if (process.env.API_VERSION) {
                version = `/${process.env.API_VERSION}`;
            }
            if (config.version === false) {
                version = '';
            }
            config.headers = Object.assign(config.headers || {}, { authentication: this.options.token });
            if (config.application) {
                config.headers.app_key = JSON.stringify({ application: config.application });
            }
            config.uri = this.options.ctUrl + version + config.uri;
            return requestPromise(config);
        } catch (err) {
            this.options.logger.error('Error to doing request', err);
            throw err;
        }

    }

}

export default new Microservice();
