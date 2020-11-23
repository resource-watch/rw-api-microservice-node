import requestPromise from 'request-promise';
import RegisterService from 'register.service';
import Promise from 'bluebird';
import type RWAPIMicroservice from '../types';
import { Context, Next } from "koa";
import type request from "request";

const KOA1 = 'KOA1';
const KOA2 = 'KOA2';
const EXPRESS = 'EXPRESS';
const MODE_AUTOREGISTER = 'MODE_AUTOREGISTER';
const MODE_NORMAL = 'MODE_NORMAL';


class Microservice {
    public options: RWAPIMicroservice.RegisterOptions;

    * registerKoa1(ctx: Context, info: Record<string, any>, swagger: Record<string, any>, next: Next) {
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
        yield next;
    }

    async registerKoa2(ctx: Context, info: Record<string, any>, swagger: Record<string, any>, next: Next) {
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

    init(opts: RWAPIMicroservice.RegisterOptions) {
        this.options = opts;
    }

    register(opts: RWAPIMicroservice.RegisterOptions):Promise<any> {
        if (opts) {
            this.options = opts;
        }
        return new Promise((resolve, reject) => {
            this.options.logger.info('Initializing register microservice');
            const ctxLib = this;
            switch (opts.framework) {

                case KOA1:
                    opts.app.use(function* (next: Next) {
                        yield ctxLib.registerKoa1(this, opts.info, opts.swagger, next);
                    });
                    break;
                case KOA2:
                    opts.app.use(async (ctx: Context, next: Next) => {
                        this.options.logger.info('Entering with path', ctx.path);
                        await ctxLib.registerKoa2(ctx, opts.info, opts.swagger, next);
                    });
                    break;
                default:

            }

            this.options.logger.debug('Checking mode');
            let promise = null;
            switch (opts.mode) {

                case MODE_AUTOREGISTER:
                    promise = RegisterService.register(opts.name, opts.url, opts.active, opts.ctUrl);
                    break;
                default:

            }
            if (promise) {
                promise.then(() => {
                    this.options.logger.debug('Register microservice complete successfully!');
                    resolve();
                }, (err) => {
                    this.options.logger.error('Error registering', err);
                    reject(err);
                });
            } else {
                this.options.logger.debug('Register microservice complete successfully!');
                resolve();
            }
        });
    }

    requestToMicroservice(config: request.OptionsWithUri & RWAPIMicroservice.RequestToMicroserviceOptions) {
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

    get KOA2() {
        return KOA2;
    }

    get KOA1() {
        return KOA1;
    }

    get EXPRESS() {
        return EXPRESS;
    }

    get MODE_AUTOREGISTER() {
        return MODE_AUTOREGISTER;
    }

    get MODE_NORMAL() {
        return MODE_NORMAL;
    }

}

export default new Microservice();
