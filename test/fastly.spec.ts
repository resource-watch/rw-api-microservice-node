import Koa2 from "koa";
import nock from 'nock';
import chai from 'chai';
import { BootstrapArguments, RWAPIMicroservice } from 'main';
import type Logger from "bunyan";
import { LogLevel } from "bunyan";
import bunyan from "bunyan";
import type Koa from "koa";
import Router from "koa-router";
import koaBody from "koa-body";
import type { Server } from "http";
import type Request from "superagent";
import constants from './utils/test.constants';
import ChaiHttp from 'chai-http';

chai.should();
chai.use(ChaiHttp);

nock.disableNetConnect();
nock.enableNetConnect('127.0.0.1');

let requester: ChaiHttp.Agent;

describe('Fastly integration tests', () => {

    before(nock.cleanAll);

    it('Requests with no cache headers should not be cached by Fastly', async () => {
        const app: Koa = new Koa2();

        const logger: Logger = bunyan.createLogger({
            name: 'logger name',
            src: true,
            streams: [{
                stream: process.stdout,
                level: process.env['LOGGER_LEVEL'] as LogLevel || 'debug',
            }],
        });

        const registerOptions: BootstrapArguments = {
            logger,
            gatewayURL: 'https://controltower.dev',
            microserviceToken: constants.MICROSERVICE_TOKEN,
            fastlyEnabled: 'true',
            fastlyAPIKey: 'fastlyAPIKey',
            fastlyServiceId: 'fastlyServiceId',
            skipGetLoggedUser: true,
            requireAPIKey: false,
            awsCloudWatchLoggingEnabled: false,
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

        const response: Request.Response = await requester
            .get('/test');

        response.status.should.equal(200);
        response.text.should.equal('ok');
        response.should.not.have.header('Surrogate-Key');
        response.should.have.header('Cache-Control', 'private');
    });

    it('Authenticated GET requests with cache headers should not be cached by Fastly', async () => {
        const app: Koa = new Koa2();

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
            fastlyEnabled: true,
            fastlyAPIKey: 'fastlyAPIKey',
            fastlyServiceId: 'fastlyServiceId',
            skipGetLoggedUser: true,
            requireAPIKey: false,
            awsCloudWatchLoggingEnabled: false,
        };

        const testRouter: Router = new Router();
        testRouter.get('/test', (ctx: Koa.Context) => {
            ctx.set('cache', `abc def`);
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

        response.status.should.equal(200);
        response.text.should.equal('ok');
        response.should.not.have.header('Surrogate-Key');
        response.should.have.header('Cache-Control', 'private');
    });

    it('Anonymous GET requests with cache headers (space separated strings) should be cached by Fastly (happy case)', async () => {
        const app: Koa = new Koa2();

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
            fastlyEnabled: true,
            fastlyAPIKey: 'fastlyAPIKey',
            fastlyServiceId: 'fastlyServiceId',
            skipGetLoggedUser: true,
            requireAPIKey: false,
            awsCloudWatchLoggingEnabled: false,
        };

        const testRouter: Router = new Router();
        testRouter.get('/test', (ctx: Koa.Context) => {
            ctx.set('cache', `abc def`);
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
            .get('/test');

        response.status.should.equal(200);
        response.text.should.equal('ok');
        response.should.have.header('Surrogate-Key', 'abc def');
        response.should.not.have.header('Cache-Control');
    });

    it('Anonymous GET requests with cache headers (string array) should be cached by Fastly (happy case)', async () => {
        const app: Koa = new Koa2();

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
            fastlyEnabled: true,
            fastlyAPIKey: 'fastlyAPIKey',
            fastlyServiceId: 'fastlyServiceId',
            skipGetLoggedUser: true,
            requireAPIKey: false,
            awsCloudWatchLoggingEnabled: false,
        };

        const testRouter: Router = new Router();
        testRouter.get('/test', (ctx: Koa.Context) => {
            ctx.set('cache', [`abc`, `def`]);
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
            .get('/test');

        response.status.should.equal(200);
        response.text.should.equal('ok');
        response.should.have.header('Surrogate-Key', 'abc def');
        response.should.not.have.header('Cache-Control');
    });

    it('Anonymous POST/PUT/PATCH/DELETE requests with cache headers should not be cached by Fastly', async () => {
        const app: Koa = new Koa2();

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
            fastlyEnabled: true,
            fastlyAPIKey: 'fastlyAPIKey',
            fastlyServiceId: 'fastlyServiceId',
            skipGetLoggedUser: true,
            requireAPIKey: false,
            awsCloudWatchLoggingEnabled: false,
        };

        const testRouter: Router = new Router();
        testRouter.post('/test', (ctx: Koa.Context) => {
            ctx.set('cache', `abc def`);
            ctx.body = 'ok';
        });
        testRouter.put('/test', (ctx: Koa.Context) => {
            ctx.set('cache', `abc def`);
            ctx.body = 'ok';
        });
        testRouter.patch('/test', (ctx: Koa.Context) => {
            ctx.set('cache', `abc def`);
            ctx.body = 'ok';
        });
        testRouter.delete('/test', (ctx: Koa.Context) => {
            ctx.set('cache', `abc def`);
            ctx.body = 'ok';
        });

        app.use(koaBody());
        app.use(RWAPIMicroservice.bootstrap(registerOptions));

        app
            .use(testRouter.routes())
            .use(testRouter.allowedMethods());

        const server: Server = app.listen(3010);

        requester = chai.request(server).keepOpen();

        const postResponse: Request.Response = await requester
            .post('/test');

        postResponse.status.should.equal(200);
        postResponse.text.should.equal('ok');
        postResponse.should.not.have.header('Surrogate-Key');
        postResponse.should.have.header('Cache-Control', 'private');

        const putResponse: Request.Response = await requester
            .put('/test');

        putResponse.status.should.equal(200);
        putResponse.text.should.equal('ok');
        putResponse.should.not.have.header('Surrogate-Key');
        putResponse.should.have.header('Cache-Control', 'private');

        const patchResponse: Request.Response = await requester
            .patch('/test');

        patchResponse.status.should.equal(200);
        patchResponse.text.should.equal('ok');
        patchResponse.should.not.have.header('Surrogate-Key');
        patchResponse.should.have.header('Cache-Control', 'private');

        const deleteResponse: Request.Response = await requester
            .delete('/test');

        deleteResponse.status.should.equal(200);
        deleteResponse.text.should.equal('ok');
        deleteResponse.should.not.have.header('Surrogate-Key');
        deleteResponse.should.have.header('Cache-Control', 'private');
    });

    it('POST/PUT/PATCH/DELETE requests with nocache headers (space separated strings) should clear Fastly caches', async () => {
        const app: Koa = new Koa2();

        const logger: Logger = bunyan.createLogger({
            name: 'logger name',
            src: true,
            streams: [{
                stream: process.stdout,
                level: process.env['LOGGER_LEVEL'] as LogLevel || 'warn',
            }],
        });

        nock('https://api.fastly.com')
            .post('/service/fastlyServiceId/purge', {
                "surrogate_keys": [
                    "abc",
                    "def"
                ]
            })
            .times(4)
            .reply(200);

        const registerOptions: BootstrapArguments = {
            logger,
            gatewayURL: 'https://controltower.dev',
            microserviceToken: constants.MICROSERVICE_TOKEN,
            fastlyEnabled: true,
            fastlyAPIKey: 'fastlyAPIKey',
            fastlyServiceId: 'fastlyServiceId',
            skipGetLoggedUser: true,
            requireAPIKey: false,
            awsCloudWatchLoggingEnabled: false,
        };

        const testRouter: Router = new Router();
        testRouter.post('/test', (ctx: Koa.Context) => {
            ctx.set('uncache', `abc def`);
            ctx.body = 'ok';
        });
        testRouter.put('/test', (ctx: Koa.Context) => {
            ctx.set('uncache', `abc def`);
            ctx.body = 'ok';
        });
        testRouter.patch('/test', (ctx: Koa.Context) => {
            ctx.set('uncache', `abc def`);
            ctx.body = 'ok';
        });
        testRouter.delete('/test', (ctx: Koa.Context) => {
            ctx.set('uncache', `abc def`);
            ctx.body = 'ok';
        });

        app.use(koaBody());
        app.use(RWAPIMicroservice.bootstrap(registerOptions));

        app
            .use(testRouter.routes())
            .use(testRouter.allowedMethods());

        const server: Server = app.listen(3010);

        requester = chai.request(server).keepOpen();

        const postResponse: Request.Response = await requester
            .post('/test');

        postResponse.status.should.equal(200);
        postResponse.text.should.equal('ok');
        postResponse.should.not.have.header('Surrogate-Key');
        postResponse.should.have.header('Cache-Control', 'private');

        const putResponse: Request.Response = await requester
            .put('/test');

        putResponse.status.should.equal(200);
        putResponse.text.should.equal('ok');
        putResponse.should.not.have.header('Surrogate-Key');
        putResponse.should.have.header('Cache-Control', 'private');

        const patchResponse: Request.Response = await requester
            .patch('/test');

        patchResponse.status.should.equal(200);
        patchResponse.text.should.equal('ok');
        patchResponse.should.not.have.header('Surrogate-Key');
        patchResponse.should.have.header('Cache-Control', 'private');

        const deleteResponse: Request.Response = await requester
            .delete('/test');

        deleteResponse.status.should.equal(200);
        deleteResponse.text.should.equal('ok');
        deleteResponse.should.not.have.header('Surrogate-Key');
        deleteResponse.should.have.header('Cache-Control', 'private');
    });

    it('POST/PUT/PATCH/DELETE requests with nocache headers (string array) should clear Fastly caches', async () => {
        const app: Koa = new Koa2();

        const logger: Logger = bunyan.createLogger({
            name: 'logger name',
            src: true,
            streams: [{
                stream: process.stdout,
                level: process.env['LOGGER_LEVEL'] as LogLevel || 'warn',
            }],
        });

        nock('https://api.fastly.com')
            .post('/service/fastlyServiceId/purge', {
                "surrogate_keys": [
                    "abc",
                    "def"
                ]
            })
            .times(4)
            .reply(200);

        const registerOptions: BootstrapArguments = {
            logger,
            gatewayURL: 'https://controltower.dev',
            microserviceToken: constants.MICROSERVICE_TOKEN,
            fastlyEnabled: true,
            fastlyAPIKey: 'fastlyAPIKey',
            fastlyServiceId: 'fastlyServiceId',
            skipGetLoggedUser: true,
            requireAPIKey: false,
            awsCloudWatchLoggingEnabled: false,
        };

        const testRouter: Router = new Router();
        testRouter.post('/test', (ctx: Koa.Context) => {
            ctx.set('uncache', [`abc`, `def`]);
            ctx.body = 'ok';
        });
        testRouter.put('/test', (ctx: Koa.Context) => {
            ctx.set('uncache', [`abc`, `def`]);
            ctx.body = 'ok';
        });
        testRouter.patch('/test', (ctx: Koa.Context) => {
            ctx.set('uncache', [`abc`, `def`]);
            ctx.body = 'ok';
        });
        testRouter.delete('/test', (ctx: Koa.Context) => {
            ctx.set('uncache', [`abc`, `def`]);
            ctx.body = 'ok';
        });

        app.use(koaBody());
        app.use(RWAPIMicroservice.bootstrap(registerOptions));

        app
            .use(testRouter.routes())
            .use(testRouter.allowedMethods());

        const server: Server = app.listen(3010);

        requester = chai.request(server).keepOpen();

        const postResponse: Request.Response = await requester
            .post('/test');

        postResponse.status.should.equal(200);
        postResponse.text.should.equal('ok');
        postResponse.should.not.have.header('Surrogate-Key');
        postResponse.should.have.header('Cache-Control', 'private');

        const putResponse: Request.Response = await requester
            .put('/test');

        putResponse.status.should.equal(200);
        putResponse.text.should.equal('ok');
        putResponse.should.not.have.header('Surrogate-Key');
        putResponse.should.have.header('Cache-Control', 'private');

        const patchResponse: Request.Response = await requester
            .patch('/test');

        patchResponse.status.should.equal(200);
        patchResponse.text.should.equal('ok');
        patchResponse.should.not.have.header('Surrogate-Key');
        patchResponse.should.have.header('Cache-Control', 'private');

        const deleteResponse: Request.Response = await requester
            .delete('/test');

        deleteResponse.status.should.equal(200);
        deleteResponse.text.should.equal('ok');
        deleteResponse.should.not.have.header('Surrogate-Key');
        deleteResponse.should.have.header('Cache-Control', 'private');
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

