import nock from 'nock';
import chai, { expect } from 'chai';
import { BootstrapArguments, RWAPIMicroservice } from 'main';
import type Logger from "bunyan";
import bunyan from "bunyan";
import type Koa from "koa";
import Router from "koa-router";
// @ts-ignore
import Koa2 from "koa2";
import koaBody from "koa-body";
import type { Server } from "http";
import type Request from "superagent";
import constants from './utils/test.constants';
import ChaiHttp from 'chai-http';

chai.should();

nock.disableNetConnect();
nock.enableNetConnect('127.0.0.1');

let requester: ChaiHttp.Agent;

describe('Injecting logged user data - error cases - Koa v2.x', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        nock.cleanAll();
    });

    // it('404 when getting user data', async () => {
    //     const app: Koa = new Koa2();
    //
    //     const logger: Logger = bunyan.createLogger({
    //         name: 'logger name',
    //         src: true,
    //         streams: []
    //     });
    //
    //     nock('https://controltower.dev', {
    //         reqheaders: {
    //             authorization: `Bearer ${constants.TOKEN}`,
    //         }
    //     })
    //         .get('/auth/user/me')
    //         .reply(404, 'Not Found');
    //
    //     const registerOptions: BootstrapArguments = {
    //         info: { name: 'test MS' },
    //         swagger: { swagger: 'test swagger' },
    //         logger,
    //         name: 'test MS',
    //         baseURL: 'https://controltower.dev',
    //         url: 'https://microservice.dev',
    //         token: 'ABCDEF',
    //         fastlyEnabled: false
    //     };
    //
    //     const testRouter: Router = new Router();
    //     testRouter.get('/test', (ctx: Koa.Context) => {
    //         ctx.request.should.have.header('Authorization', `Bearer ${constants.TOKEN}`);
    //         expect(ctx.request.query).to.have.property('loggedUser').and.equal(JSON.stringify(constants.USER));
    //         ctx.body = 'ok';
    //     });
    //
    //     app.use(koaBody());
    //     app.use(RWAPIMicroservice.bootstrap(registerOptions));
    //
    //     app
    //         .use(testRouter.routes())
    //         .use(testRouter.allowedMethods());
    //
    //     const server: Server = app.listen(3010);
    //
    //     requester = chai.request(server).keepOpen();
    //
    //     const response: Request.Response = await requester
    //         .get('/test')
    //         .set('Authorization', `Bearer ${constants.TOKEN}`);
    //
    //
    //     response.status.should.equal(500);
    //     response.text.should.equal('Internal Server Error');
    // });
    //
    // it('500 when getting user data', async () => {
    //     const app: Koa = new Koa2();
    //
    //     const logger: Logger = bunyan.createLogger({
    //         name: 'logger name',
    //         src: true,
    //         streams: []
    //     });
    //
    //     nock('https://controltower.dev', {
    //         reqheaders: {
    //             authorization: `Bearer ${constants.TOKEN}`,
    //         }
    //     })
    //         .get('/auth/user/me')
    //         .reply(500, 'Server error');
    //
    //     const registerOptions: BootstrapArguments = {
    //         info: { name: 'test MS' },
    //         swagger: { swagger: 'test swagger' },
    //         logger,
    //         name: 'test MS',
    //         baseURL: 'https://controltower.dev',
    //         url: 'https://microservice.dev',
    //         token: 'ABCDEF',
    //         fastlyEnabled: false
    //     };
    //
    //     const testRouter: Router = new Router();
    //     testRouter.get('/test', (ctx: Koa.Context) => {
    //         ctx.request.should.have.header('Authorization', `Bearer ${constants.TOKEN}`);
    //         expect(ctx.request.query).to.have.property('loggedUser').and.equal(JSON.stringify(constants.USER));
    //         ctx.body = 'ok';
    //     });
    //
    //     app.use(koaBody());
    //     app.use(RWAPIMicroservice.bootstrap(registerOptions));
    //
    //     app
    //         .use(testRouter.routes())
    //         .use(testRouter.allowedMethods());
    //
    //     const server: Server = app.listen(3010);
    //
    //     requester = chai.request(server).keepOpen();
    //
    //     const response: Request.Response = await requester
    //         .get('/test')
    //         .set('Authorization', `Bearer ${constants.TOKEN}`);
    //
    //
    //     response.status.should.equal(500);
    //     response.text.should.equal('Internal Server Error');
    // });

    it('"Your token is outdated" when getting user data', async () => {
        const app: Koa = new Koa2();

        const logger: Logger = bunyan.createLogger({
            name: 'logger name',
            src: true,
            streams: []
        });

        nock('https://controltower.dev', {
            reqheaders: {
                authorization: `Bearer ${constants.TOKEN}`,
            }
        })
            .get('/auth/user/me')
            .reply(401, {
                "errors": [
                    {
                        "status": 401,
                        "detail": "Your token is outdated. Please use /auth/login to login and /auth/generate-token to generate a new token."
                    }
                ]
            });

        const registerOptions: BootstrapArguments = {
            info: { name: 'test MS' },
            swagger: { swagger: 'test swagger' },
            logger,
            name: 'test MS',
            baseURL: 'https://controltower.dev',
            url: 'https://microservice.dev',
            token: 'ABCDEF',
            fastlyEnabled: false
        };

        const testRouter: Router = new Router();
        testRouter.get('/test', (ctx: Koa.Context) => {
            ctx.request.should.have.header('Authorization', `Bearer ${constants.TOKEN}`);
            expect(ctx.request.query).to.have.property('loggedUser').and.equal(JSON.stringify(constants.USER));
            ctx.body = 'ok';
        });

        app.use(koaBody());
        app.use(RWAPIMicroservice.bootstrap(registerOptions));

        app
            .use(testRouter.routes())
            .use(testRouter.allowedMethods());

        const server: Server = app.listen(3010);

        requester = chai.request(server).keepOpen();

        const response: Request.Response = await requester
            .get('/test')
            .set('Authorization', `Bearer ${constants.TOKEN}`);

        response.status.should.equal(401);
        response.body.should.have.property('errors').and.be.an('array');
        response.body.errors[0].should.have.property('detail').and.equal(`Your token is outdated. Please use /auth/login to login and /auth/generate-token to generate a new token.`);
    });

    afterEach(() => {
        if (requester) {
            requester.close();
            requester = null;
        }

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});

