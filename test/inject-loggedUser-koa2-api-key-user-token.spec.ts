import Koa2 from "koa";
import nock from 'nock';
import chai, { expect } from 'chai';
import { BootstrapArguments, RWAPIMicroservice } from 'main';
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
import { mockCloudWatchLogRequestsSequence, mockValidateRequestWithApiKeyAndUserToken } from "./utils/mocks";

chai.should();
chai.use(ChaiHttp);

nock.disableNetConnect();
nock.enableNetConnect('127.0.0.1');

let requester: ChaiHttp.Agent;

describe('Injecting logged user data - Koa v2.x with API key and user token', () => {

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

        mockValidateRequestWithApiKeyAndUserToken();
        mockCloudWatchLogRequestsSequence({
            user: constants.USER,
            application: constants.APPLICATION,
        });

        const registerOptions: BootstrapArguments = {
            logger,
            gatewayURL: 'https://controltower.dev',
            microserviceToken: constants.MICROSERVICE_TOKEN,
            fastlyEnabled: false,
            awsRegion: 'eu-west-1',
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
            .set('x-api-key', `api-key-test`)
            .set('Authorization', `Bearer ${constants.USER_TOKEN}`);

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

        mockValidateRequestWithApiKeyAndUserToken();
        mockCloudWatchLogRequestsSequence({
            user: constants.USER,
            application: constants.APPLICATION,
        });

        const registerOptions: BootstrapArguments = {
            logger,
            gatewayURL: 'https://controltower.dev',
            microserviceToken: constants.MICROSERVICE_TOKEN,
            fastlyEnabled: false,
            awsRegion: 'eu-west-1',
            awsCloudWatchLogStreamName: 'test',
        };

        const testRouter: Router = new Router();
        testRouter.delete('/test', (ctx: Koa.Context) => {
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
            .delete('/test')
            .set('X-api-key', `api-key-test`)
            .set('Authorization', `Bearer ${constants.USER_TOKEN}`);

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

        mockValidateRequestWithApiKeyAndUserToken();
        mockCloudWatchLogRequestsSequence({
            user: constants.USER,
            application: constants.APPLICATION,
        });

        const registerOptions: BootstrapArguments = {
            logger,
            gatewayURL: 'https://controltower.dev',
            microserviceToken: constants.MICROSERVICE_TOKEN,
            fastlyEnabled: false,
            awsRegion: 'eu-west-1',
            awsCloudWatchLogStreamName: 'test',
        };

        const testRouter: Router = new Router();
        testRouter.post('/test', (ctx: Koa.Context) => {
            ctx.request.should.have.header('Authorization', `Bearer ${constants.USER_TOKEN}`);
            ctx.request.body.should.have.property('data').and.deep.equal('test');
            ctx.request.body.should.have.property('loggedUser').and.deep.equal(constants.USER);
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
            .set('Authorization', `Bearer ${constants.USER_TOKEN}`)
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

        mockValidateRequestWithApiKeyAndUserToken();
        mockCloudWatchLogRequestsSequence({
            user: constants.USER,
            application: constants.APPLICATION,
        });

        const registerOptions: BootstrapArguments = {
            logger,
            gatewayURL: 'https://controltower.dev',
            microserviceToken: constants.MICROSERVICE_TOKEN,
            fastlyEnabled: false,
            awsRegion: 'eu-west-1',
            awsCloudWatchLogStreamName: 'test',
        };

        const testRouter: Router = new Router();
        testRouter.patch('/test', (ctx: Koa.Context) => {
            ctx.request.should.have.header('Authorization', `Bearer ${constants.USER_TOKEN}`);
            ctx.request.body.should.have.property('data').and.deep.equal('test');
            ctx.request.body.should.have.property('loggedUser').and.deep.equal(constants.USER);
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
            .set('Authorization', `Bearer ${constants.USER_TOKEN}`)
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

        mockValidateRequestWithApiKeyAndUserToken();
        mockCloudWatchLogRequestsSequence({
            user: constants.USER,
            application: constants.APPLICATION,
        });

        const registerOptions: BootstrapArguments = {
            logger,
            gatewayURL: 'https://controltower.dev',
            microserviceToken: constants.MICROSERVICE_TOKEN,
            fastlyEnabled: false,
            awsRegion: 'eu-west-1',
            awsCloudWatchLogStreamName: 'test',
        };

        const testRouter: Router = new Router();
        testRouter.put('/test', (ctx: Koa.Context) => {
            ctx.request.should.have.header('Authorization', `Bearer ${constants.USER_TOKEN}`);
            ctx.request.body.should.have.property('data').and.deep.equal('test');
            ctx.request.body.should.have.property('loggedUser').and.deep.equal(constants.USER);
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
            .set('Authorization', `Bearer ${constants.USER_TOKEN}`)
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

