import Koa2 from "koa";
import nock from 'nock';
import chai from 'chai';
import { expect } from 'chai';
import { RWAPIMicroservice } from 'main';
import type Logger from "bunyan";
import type { LogLevel } from "bunyan";
import bunyan from "bunyan";
import type Koa from "koa";
import Router from "koa-router";
import koaBody from "koa-body";
import type { Server } from "http";
import type Request from "superagent";
import constants from './utils/test.constants';
import ChaiHttp from 'chai-http';
import { BootstrapArguments } from "../src/types";

chai.should();

nock.disableNetConnect();
nock.enableNetConnect('127.0.0.1');

let requester: ChaiHttp.Agent;

describe('Injecting logged user data - error cases - Koa v2.x', () => {

    before(nock.cleanAll);

    it('404 when getting user data', async () => {
        const app: Koa = new Koa2();

        const logger: Logger = bunyan.createLogger({
            name: 'logger name',
            src: true,
            streams: [],
        });

        nock('https://controltower.dev', {
            reqheaders: {
                authorization: `Bearer ${constants.MICROSERVICE_TOKEN}`,
            }
        })
            .post('/v1/request/validate')
            .reply(404, {
                "errors": [
                    {
                        "status": 404,
                        "detail": "User not found"
                    }
                ]
            });

        const registerOptions: BootstrapArguments = {
            logger,
            gatewayURL: 'https://controltower.dev',
            microserviceToken: constants.MICROSERVICE_TOKEN,
            fastlyEnabled: false,
            requireAPIKey: false,
            awsRegion: 'us-east-1',
            awsCloudWatchLogStreamName: 'test',
        };

        const testRouter: Router = new Router();
        testRouter.get('/test', (ctx: Koa.Context) => {
            ctx.request.should.have.header('Authorization', `Bearer ${constants.USER_TOKEN}`);
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
            .set('Authorization', `Bearer ${constants.USER_TOKEN}`);


        response.status.should.equal(404);
        response.body.should.have.property('errors').and.be.an('array');
        response.body.errors[0].should.have.property('detail').and.equal(`User not found`);

    });

    it('500 when getting user data', async () => {
        const app: Koa = new Koa2();

        const logger: Logger = bunyan.createLogger({
            name: 'logger name',
            src: true,
            streams: [{
                stream: process.stdout,
                level: process.env['LOGGER_LEVEL'] as LogLevel || 'warn',
            }],
        });

        nock('https://controltower.dev', {
            reqheaders: {
                authorization: `Bearer ${constants.MICROSERVICE_TOKEN}`,
            }
        })
            .post('/v1/request/validate')
            .reply(500, 'Server error');

        const registerOptions: BootstrapArguments = {
            logger,
            gatewayURL: 'https://controltower.dev',
            microserviceToken: constants.MICROSERVICE_TOKEN,
            fastlyEnabled: false,
            requireAPIKey: false,
            awsRegion: 'us-east-1',
            awsCloudWatchLogStreamName: 'test',
        };

        const testRouter: Router = new Router();
        testRouter.get('/test', (ctx: Koa.Context) => {
            ctx.request.should.have.header('Authorization', `Bearer ${constants.USER_TOKEN}`);
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
            .set('Authorization', `Bearer ${constants.USER_TOKEN}`);


        response.status.should.equal(500);
        response.text.should.equal('Server error');
    });

    it('"Your token is outdated" when getting user data', async () => {
        const app: Koa = new Koa2();

        const logger: Logger = bunyan.createLogger({
            name: 'logger name',
            src: true,
            streams: [{
                stream: process.stdout,
                level: process.env['LOGGER_LEVEL'] as LogLevel || 'warn',
            }],
        });

        nock('https://controltower.dev', {
            reqheaders: {
                authorization: `Bearer ${constants.MICROSERVICE_TOKEN}`,
            }
        })
            .post('/v1/request/validate')
            .reply(401, {
                "errors": [
                    {
                        "status": 401,
                        "detail": "Your token is outdated. Please use /auth/login to login and /auth/generate-token to generate a new token."
                    }
                ]
            });

        const registerOptions: BootstrapArguments = {
            logger,
            gatewayURL: 'https://controltower.dev',
            microserviceToken: constants.MICROSERVICE_TOKEN,
            fastlyEnabled: false,
            requireAPIKey: false,
            awsRegion: 'us-east-1',
            awsCloudWatchLogStreamName: 'test',
        };

        const testRouter: Router = new Router();
        testRouter.get('/test', (ctx: Koa.Context) => {
            ctx.request.should.have.header('Authorization', `Bearer ${constants.USER_TOKEN}`);
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
            .set('Authorization', `Bearer ${constants.USER_TOKEN}`);

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

