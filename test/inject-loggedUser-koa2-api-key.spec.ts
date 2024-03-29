import Koa2 from "koa";
import nock from 'nock';
import chai, { expect } from 'chai';
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
import { mockValidateRequestWithApiKey } from "./utils/mocks";
import { BootstrapArguments } from "../src/types";
import { mockCloudWatchLogRequest, mockCloudWatchSetupRequestsSequence } from "../src/test-mocks";
import { RWAPIMicroservice } from "../src/main";

chai.should();
chai.use(ChaiHttp);

nock.disableNetConnect();
nock.enableNetConnect('127.0.0.1');

let requester: ChaiHttp.Agent;

describe('Injecting logged user data - Koa v2.x with API key', () => {

    before(nock.cleanAll);

    it('GET request with a JWT microserviceToken in the header should fetch the user data and pass it along as loggedUser (happy case)', async () => {
        const app: Koa = new Koa2();

        const logger: Logger = bunyan.createLogger({
            name: 'logger name',
            src: true,
            streams: [{
                stream: process.stdout,
                level: process.env['LOGGER_LEVEL'] as LogLevel || 'warn',
            }],
        });

        mockValidateRequestWithApiKey('https://controltower.dev');
        mockCloudWatchSetupRequestsSequence();
        mockCloudWatchLogRequest({
            application: constants.APPLICATION,
        });

        const registerOptions: BootstrapArguments = {
            logger,
            gatewayURL: 'https://controltower.dev',
            microserviceToken: constants.MICROSERVICE_TOKEN,
            fastlyEnabled: false,
            awsRegion: 'us-east-1',
            awsCloudWatchLogStreamName: 'test',
        };

        const testRouter: Router = new Router();
        testRouter.get('/test', (ctx: Koa.Context) => {
            ctx.request.should.not.have.header('Authorization');
            expect(ctx.state).to.have.property('requestApplication').and.deep.equal(constants.APPLICATION);
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
            .set('x-api-key', `api-key-test`);

        response.status.should.equal(200);
        response.text.should.equal('ok');
    });

    it('DELETE request with a JWT microserviceToken in the header should fetch the user data and pass it along as loggedUser (happy case)', async () => {
        const app: Koa = new Koa2();

        const logger: Logger = bunyan.createLogger({
            name: 'logger name',
            src: true,
            streams: [{
                stream: process.stdout,
                level: process.env['LOGGER_LEVEL'] as LogLevel || 'warn',
            }],
        });

        mockValidateRequestWithApiKey('https://controltower.dev');
        mockCloudWatchSetupRequestsSequence();
        mockCloudWatchLogRequest({
            application: constants.APPLICATION,
        });

        const registerOptions: BootstrapArguments = {
            logger,
            gatewayURL: 'https://controltower.dev',
            microserviceToken: constants.MICROSERVICE_TOKEN,
            fastlyEnabled: false,
            awsRegion: 'us-east-1',
            awsCloudWatchLogStreamName: 'test',
        };

        const testRouter: Router = new Router();
        testRouter.delete('/test', (ctx: Koa.Context) => {
            ctx.request.should.not.have.header('Authorization');
            expect(ctx.state).to.have.property('requestApplication').and.deep.equal(constants.APPLICATION);
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
            .delete('/test')
            .set('X-api-key', `api-key-test`);

        response.status.should.equal(200);
        response.text.should.equal('ok');
    });

    it('POST request with a JWT microserviceToken in the header should fetch the user data and pass it along as loggedUser (happy case)', async () => {
        const app: Koa = new Koa2();

        const logger: Logger = bunyan.createLogger({
            name: 'logger name',
            src: true,
            streams: [{
                stream: process.stdout,
                level: process.env['LOGGER_LEVEL'] as LogLevel || 'warn',
            }],
        });

        mockValidateRequestWithApiKey('https://controltower.dev');
        mockCloudWatchSetupRequestsSequence();
        mockCloudWatchLogRequest({
            application: constants.APPLICATION,
        });

        const registerOptions: BootstrapArguments = {
            logger,
            gatewayURL: 'https://controltower.dev',
            microserviceToken: constants.MICROSERVICE_TOKEN,
            fastlyEnabled: false,
            awsRegion: 'us-east-1',
            awsCloudWatchLogStreamName: 'test',
        };

        const testRouter: Router = new Router();
        testRouter.post('/test', (ctx: Koa.Context) => {
            ctx.request.should.not.have.header('Authorization');
            ctx.request.body.should.have.property('data').and.deep.equal('test');
            expect(ctx.state).to.have.property('requestApplication').and.deep.equal(constants.APPLICATION);
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
            .post('/test')
            .set('X-api-key', `api-key-test`)
            .send({
                data: 'test'
            });

        response.status.should.equal(200);
        response.text.should.equal('ok');
    });

    it('PATCH request with a JWT microserviceToken in the header should fetch the user data and pass it along as loggedUser (happy case)', async () => {
        const app: Koa = new Koa2();

        const logger: Logger = bunyan.createLogger({
            name: 'logger name',
            src: true,
            streams: [{
                stream: process.stdout,
                level: process.env['LOGGER_LEVEL'] as LogLevel || 'warn',
            }],
        });

        mockValidateRequestWithApiKey('https://controltower.dev');
        mockCloudWatchSetupRequestsSequence();
        mockCloudWatchLogRequest({
            application: constants.APPLICATION,
        });

        const registerOptions: BootstrapArguments = {
            logger,
            gatewayURL: 'https://controltower.dev',
            microserviceToken: constants.MICROSERVICE_TOKEN,
            fastlyEnabled: false,
            awsRegion: 'us-east-1',
            awsCloudWatchLogStreamName: 'test',
        };

        const testRouter: Router = new Router();
        testRouter.patch('/test', (ctx: Koa.Context) => {
            ctx.request.should.not.have.header('Authorization');
            ctx.request.body.should.have.property('data').and.deep.equal('test');
            expect(ctx.state).to.have.property('requestApplication').and.deep.equal(constants.APPLICATION);
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
            .patch('/test')
            .set('X-api-key', `api-key-test`)
            .send({
                data: 'test'
            });

        response.status.should.equal(200);
        response.text.should.equal('ok');
    });

    it('PUT request with a JWT microserviceToken in the header should fetch the user data and pass it along as loggedUser (happy case)', async () => {
        const app: Koa = new Koa2();

        const logger: Logger = bunyan.createLogger({
            name: 'logger name',
            src: true,
            streams: [{
                stream: process.stdout,
                level: process.env['LOGGER_LEVEL'] as LogLevel || 'warn',
            }],
        });

        mockValidateRequestWithApiKey('https://controltower.dev');
        mockCloudWatchSetupRequestsSequence();
        mockCloudWatchLogRequest({
            application: constants.APPLICATION,
        });

        const registerOptions: BootstrapArguments = {
            logger,
            gatewayURL: 'https://controltower.dev',
            microserviceToken: constants.MICROSERVICE_TOKEN,
            fastlyEnabled: false,
            awsRegion: 'us-east-1',
            awsCloudWatchLogStreamName: 'test',
        };

        const testRouter: Router = new Router();
        testRouter.put('/test', (ctx: Koa.Context) => {
            ctx.request.should.not.have.header('Authorization');
            ctx.request.body.should.have.property('data').and.deep.equal('test');
            expect(ctx.state).to.have.property('requestApplication').and.deep.equal(constants.APPLICATION);
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
            .put('/test')
            .set('X-api-key', `api-key-test`)
            .send({
                data: 'test'
            });

        response.status.should.equal(200);
        response.text.should.equal('ok');
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

