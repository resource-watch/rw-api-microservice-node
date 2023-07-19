import Koa2 from "koa";
import nock from 'nock';
import chai from 'chai';
import { RWAPIMicroservice } from 'main';
import type Logger from "bunyan";
import type { LogLevel } from "bunyan";
import bunyan from "bunyan";
import type Koa from "koa";
import Router from "koa-router";
import koaBody from "koa-body";
import type { Server } from "http";
import type Request from "superagent";
import ChaiHttp from 'chai-http';
import constants from './utils/test.constants';
import { mockCloudWatchLogRequest, mockCloudWatchSetupRequestsSequence } from "../src/test-mocks";
import { BootstrapArguments } from "../src/types";

chai.should();
chai.use(ChaiHttp);

nock.disableNetConnect();
nock.enableNetConnect('127.0.0.1');

let requester: ChaiHttp.Agent;

describe('Adding CORS headers', () => {

    before(nock.cleanAll);

    it('GET request with a Origin header should return a response with CORS headers present (happy case)', async () => {
        const app: Koa = new Koa2();

        mockCloudWatchSetupRequestsSequence();
        mockCloudWatchLogRequest();

        const logger: Logger = bunyan.createLogger({
            name: 'logger name',
            src: true,
            streams: [{
                stream: process.stdout,
                level: process.env['LOGGER_LEVEL'] as LogLevel || 'warn',
            }],
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
            ctx.body = 'ok';
        });

        app.use(koaBody());
        app.use(RWAPIMicroservice.bootstrap(registerOptions));

        app
            .use(testRouter.routes())
            .use(testRouter.allowedMethods());

        const server: Server = app.listen(3010);

        requester = chai.request(server).keepOpen();

        const preflightResponse: Request.Response = await requester
            .options('/test')
            .set('Origin', `https://staging.resourcewatch.org/`)
            .set('Access-Control-Request-Headers', `upgrade-insecure-requests`)
            .set('Access-Control-Request-Method', `GET`);

        preflightResponse.status.should.equal(204);
        preflightResponse.should.have.header('access-control-allow-origin', 'https://staging.resourcewatch.org/');
        preflightResponse.should.have.header('access-control-allow-headers', 'upgrade-insecure-requests');
        preflightResponse.should.have.header('access-control-allow-credentials', 'true');

        const mainResponse: Request.Response = await requester
            .get('/test')
            .set('Origin', `https://staging.resourcewatch.org/`);

        mainResponse.status.should.equal(200);
        mainResponse.text.should.equal('ok');
        mainResponse.should.have.header('access-control-allow-origin', 'https://staging.resourcewatch.org/');
        mainResponse.should.have.header('access-control-allow-credentials', 'true');
    });

    it('DELETE request with a Origin header should return a response with CORS headers present (happy case)', async () => {
        const app: Koa = new Koa2();

        mockCloudWatchSetupRequestsSequence();
        mockCloudWatchLogRequest();

        const logger: Logger = bunyan.createLogger({
            name: 'logger name',
            src: true,
            streams: [{
                stream: process.stdout,
                level: process.env['LOGGER_LEVEL'] as LogLevel || 'warn',
            }],
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
        testRouter.delete('/test', (ctx: Koa.Context) => {
            ctx.body = 'ok';
        });

        app.use(koaBody());
        app.use(RWAPIMicroservice.bootstrap(registerOptions));

        app
            .use(testRouter.routes())
            .use(testRouter.allowedMethods());

        const server: Server = app.listen(3010);

        requester = chai.request(server).keepOpen();

        const preflightResponse: Request.Response = await requester
            .options('/test')
            .set('Origin', `https://staging.resourcewatch.org/`)
            .set('Access-Control-Request-Headers', `upgrade-insecure-requests`)
            .set('Access-Control-Request-Method', `DELETE`);

        preflightResponse.status.should.equal(204);
        preflightResponse.should.have.header('access-control-allow-origin', 'https://staging.resourcewatch.org/');
        preflightResponse.should.have.header('access-control-allow-headers', 'upgrade-insecure-requests');
        preflightResponse.should.have.header('access-control-allow-credentials', 'true');

        const mainResponse: Request.Response = await requester
            .delete('/test')
            .set('Origin', `https://staging.resourcewatch.org/`);


        mainResponse.status.should.equal(200);
        mainResponse.text.should.equal('ok');
        mainResponse.should.have.header('access-control-allow-origin', 'https://staging.resourcewatch.org/');
        mainResponse.should.have.header('access-control-allow-credentials', 'true');
    });

    it('POST request with a Origin header should return a response with CORS headers present (happy case)', async () => {
        const app: Koa = new Koa2();

        mockCloudWatchSetupRequestsSequence();
        mockCloudWatchLogRequest();

        const logger: Logger = bunyan.createLogger({
            name: 'logger name',
            src: true,
            streams: [{
                stream: process.stdout,
                level: process.env['LOGGER_LEVEL'] as LogLevel || 'warn',
            }],
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
        testRouter.post('/test', (ctx: Koa.Context) => {
            ctx.body = 'ok';
        });

        app.use(koaBody());
        app.use(RWAPIMicroservice.bootstrap(registerOptions));

        app
            .use(testRouter.routes())
            .use(testRouter.allowedMethods());

        const server: Server = app.listen(3010);

        requester = chai.request(server).keepOpen();

        const preflightResponse: Request.Response = await requester
            .options('/test')
            .set('Origin', `https://staging.resourcewatch.org/`)
            .set('Access-Control-Request-Headers', `upgrade-insecure-requests`)
            .set('Access-Control-Request-Method', `POST`);

        preflightResponse.status.should.equal(204);
        preflightResponse.should.have.header('access-control-allow-origin', 'https://staging.resourcewatch.org/');
        preflightResponse.should.have.header('access-control-allow-headers', 'upgrade-insecure-requests');
        preflightResponse.should.have.header('access-control-allow-credentials', 'true');

        const mainResponse: Request.Response = await requester
            .post('/test')
            .set('Origin', `https://staging.resourcewatch.org/`)
            .send({
                data: 'test'
            });

        mainResponse.status.should.equal(200);
        mainResponse.text.should.equal('ok');
        mainResponse.should.have.header('access-control-allow-origin', 'https://staging.resourcewatch.org/');
        mainResponse.should.have.header('access-control-allow-credentials', 'true');
    });

    it('PATCH request with a Origin header should return a response with CORS headers present (happy case)', async () => {
        const app: Koa = new Koa2();

        mockCloudWatchSetupRequestsSequence();
        mockCloudWatchLogRequest();

        const logger: Logger = bunyan.createLogger({
            name: 'logger name',
            src: true,
            streams: [{
                stream: process.stdout,
                level: process.env['LOGGER_LEVEL'] as LogLevel || 'warn',
            }],
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
        testRouter.patch('/test', (ctx: Koa.Context) => {
            ctx.body = 'ok';
        });

        app.use(koaBody());
        app.use(RWAPIMicroservice.bootstrap(registerOptions));

        app
            .use(testRouter.routes())
            .use(testRouter.allowedMethods());

        const server: Server = app.listen(3010);

        requester = chai.request(server).keepOpen();

        const preflightResponse: Request.Response = await requester
            .options('/test')
            .set('Origin', `https://staging.resourcewatch.org/`)
            .set('Access-Control-Request-Headers', `upgrade-insecure-requests`)
            .set('Access-Control-Request-Method', `PATCH`);

        preflightResponse.status.should.equal(204);
        preflightResponse.should.have.header('access-control-allow-origin', 'https://staging.resourcewatch.org/');
        preflightResponse.should.have.header('access-control-allow-headers', 'upgrade-insecure-requests');
        preflightResponse.should.have.header('access-control-allow-credentials', 'true');

        const mainResponse: Request.Response = await requester
            .patch('/test')
            .set('Origin', `https://staging.resourcewatch.org/`)
            .send({
                data: 'test'
            });

        mainResponse.status.should.equal(200);
        mainResponse.text.should.equal('ok');
        mainResponse.should.have.header('access-control-allow-origin', 'https://staging.resourcewatch.org/');
        mainResponse.should.have.header('access-control-allow-credentials', 'true');
    });

    it('PUT request with a Origin header should return a response with CORS headers present (happy case)', async () => {
        const app: Koa = new Koa2();

        mockCloudWatchSetupRequestsSequence();
        mockCloudWatchLogRequest();

        const logger: Logger = bunyan.createLogger({
            name: 'logger name',
            src: true,
            streams: [{
                stream: process.stdout,
                level: process.env['LOGGER_LEVEL'] as LogLevel || 'warn',
            }],
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
        testRouter.put('/test', (ctx: Koa.Context) => {
            ctx.body = 'ok';
        });

        app.use(koaBody());
        app.use(RWAPIMicroservice.bootstrap(registerOptions));

        app
            .use(testRouter.routes())
            .use(testRouter.allowedMethods());

        const server: Server = app.listen(3010);

        requester = chai.request(server).keepOpen();

        const preflightResponse: Request.Response = await requester
            .options('/test')
            .set('Origin', `https://staging.resourcewatch.org/`)
            .set('Access-Control-Request-Headers', `upgrade-insecure-requests`)
            .set('Access-Control-Request-Method', `PUT`);

        preflightResponse.status.should.equal(204);
        preflightResponse.should.have.header('access-control-allow-origin', 'https://staging.resourcewatch.org/');
        preflightResponse.should.have.header('access-control-allow-headers', 'upgrade-insecure-requests');
        preflightResponse.should.have.header('access-control-allow-credentials', 'true');

        const mainResponse: Request.Response = await requester
            .put('/test')
            .set('Origin', `https://staging.resourcewatch.org/`)
            .send({
                data: 'test'
            });

        mainResponse.status.should.equal(200);
        mainResponse.text.should.equal('ok');
        mainResponse.should.have.header('access-control-allow-origin', 'https://staging.resourcewatch.org/');
        mainResponse.should.have.header('access-control-allow-credentials', 'true');
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

