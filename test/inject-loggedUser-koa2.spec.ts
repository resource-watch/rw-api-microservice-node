import nock from 'nock';
import chai from 'chai';
import microservice from 'main';
import bunyan from "bunyan";
import type Koa from "koa";
import Router from "koa-router";
// @ts-ignore
import Koa2 from "koa2";
import koaBody from "koa-body";
import type RWAPIMicroservice from '../types';
import type { Server } from "http";
import type Request from "superagent";
import constants from './utils/test.constants';
import { expect } from 'chai';

chai.should();

nock.disableNetConnect();
nock.enableNetConnect('127.0.0.1');

let requester: ChaiHttp.Agent;

describe('Injecting logged user data - Koa v2.x', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        nock.cleanAll();
    });

    it('GET request with a JWT token in the header should fetch the user data and pass it along as loggedUser (happy case)', async () => {
        const app: Koa = new Koa2();

        const logger: Logger = bunyan.createLogger({
            name: 'logger name',
            src: true,
            streams: []
        });

        nock('https://controltower.dev')
             .post('/api/v1/microservice', {
                name: "test MS",
                url: "https://microservice.dev",
                active: true
            })
            .reply(200);

        nock('https://controltower.dev')
            .get('/auth/user/me')
            .reply(200, constants.USER);

        const registerOptions: RWAPIMicroservice.RegisterOptions = {
            info: { name: 'test MS' },
            swagger: { swagger: 'test swagger' },
            mode: microservice.MODE_AUTOREGISTER,
            framework: microservice.KOA2,
            app,
            logger,
            name: 'test MS',
            baseURL: 'https://controltower.dev',
            url: 'https://microservice.dev',
            token: 'ABCDEF',
        };

        const testRouter: Router = new Router();
        testRouter.get('/test', (ctx: Koa.Context) => {
            ctx.request.should.have.header('Authorization', `Bearer ${constants.TOKEN}`);
            expect(ctx.request.query).to.have.property('loggedUser').and.equal(JSON.stringify(constants.USER));
            ctx.body = 'ok';
        });

        app.use(koaBody());

        await microservice.register(registerOptions);

        app
            .use(testRouter.routes())
            .use(testRouter.allowedMethods());

        const server: Server = app.listen(3010);

        requester = chai.request(server).keepOpen();

        const response: Request.Response = await requester
            .get('/test')
            .set('Authorization', `Bearer ${constants.TOKEN}`);


        response.status.should.equal(200);
        response.text.should.equal('ok');
    });

    it('DELETE request with a JWT token in the header should fetch the user data and pass it along as loggedUser (happy case)', async () => {
        const app: Koa = new Koa2();

        const logger: Logger = bunyan.createLogger({
            name: 'logger name',
            src: true,
            streams: []
        });

        nock('https://controltower.dev')
             .post('/api/v1/microservice', {
                name: "test MS",
                url: "https://microservice.dev",
                active: true
            })
            .reply(200);

        nock('https://controltower.dev')
            .get('/auth/user/me')
            .reply(200, constants.USER);

        const registerOptions: RWAPIMicroservice.RegisterOptions = {
            info: { name: 'test MS' },
            swagger: { swagger: 'test swagger' },
            mode: microservice.MODE_AUTOREGISTER,
            framework: microservice.KOA2,
            app,
            logger,
            name: 'test MS',
            baseURL: 'https://controltower.dev',
            url: 'https://microservice.dev',
            token: 'ABCDEF',
        };

        const testRouter: Router = new Router();
        testRouter.delete('/test', (ctx: Koa.Context) => {
            ctx.request.should.have.header('Authorization', `Bearer ${constants.TOKEN}`);
            expect(ctx.request.query).to.have.property('loggedUser').and.equal(JSON.stringify(constants.USER));
            ctx.body = 'ok';
        });

        app.use(koaBody());

        await microservice.register(registerOptions);

        app
            .use(testRouter.routes())
            .use(testRouter.allowedMethods());

        const server: Server = app.listen(3010);

        requester = chai.request(server).keepOpen();

        const response: Request.Response = await requester
            .delete('/test')
            .set('Authorization', `Bearer ${constants.TOKEN}`);


        response.status.should.equal(200);
        response.text.should.equal('ok');
    });

    it('POST request with a JWT token in the header should fetch the user data and pass it along as loggedUser (happy case)', async () => {
        const app: Koa = new Koa2();

        const logger: Logger = bunyan.createLogger({
            name: 'logger name',
            src: true,
            streams: []
        });

        nock('https://controltower.dev')
             .post('/api/v1/microservice', {
                name: "test MS",
                url: "https://microservice.dev",
                active: true
            })
            .reply(200);

        nock('https://controltower.dev')
            .get('/auth/user/me')
            .reply(200, constants.USER);

        const registerOptions: RWAPIMicroservice.RegisterOptions = {
            info: { name: 'test MS' },
            swagger: { swagger: 'test swagger' },
            mode: microservice.MODE_AUTOREGISTER,
            framework: microservice.KOA2,
            app,
            logger,
            name: 'test MS',
            baseURL: 'https://controltower.dev',
            url: 'https://microservice.dev',
            token: 'ABCDEF',
        };

        const testRouter: Router = new Router();
        testRouter.post('/test', (ctx: Koa.Context) => {
            ctx.request.should.have.header('Authorization', `Bearer ${constants.TOKEN}`);
            ctx.request.body.should.have.property('data').and.deep.equal('test');
            ctx.request.body.should.have.property('loggedUser').and.deep.equal(constants.USER);
            ctx.body = 'ok';
        });

        app.use(koaBody());

        await microservice.register(registerOptions);

        app
            .use(testRouter.routes())
            .use(testRouter.allowedMethods());

        const server: Server = app.listen(3010);

        requester = chai.request(server).keepOpen();

        const response: Request.Response = await requester
            .post('/test')
            .set('Authorization', `Bearer ${constants.TOKEN}`)
            .send({
                data: 'test'
            });

        response.status.should.equal(200);
        response.text.should.equal('ok');
    });

    it('PATCH request with a JWT token in the header should fetch the user data and pass it along as loggedUser (happy case)', async () => {
        const app: Koa = new Koa2();

        const logger: Logger = bunyan.createLogger({
            name: 'logger name',
            src: true,
            streams: []
        });

        nock('https://controltower.dev')
             .post('/api/v1/microservice', {
                name: "test MS",
                url: "https://microservice.dev",
                active: true
            })
            .reply(200);

        nock('https://controltower.dev')
            .get('/auth/user/me')
            .reply(200, constants.USER);

        const registerOptions: RWAPIMicroservice.RegisterOptions = {
            info: { name: 'test MS' },
            swagger: { swagger: 'test swagger' },
            mode: microservice.MODE_AUTOREGISTER,
            framework: microservice.KOA2,
            app,
            logger,
            name: 'test MS',
            baseURL: 'https://controltower.dev',
            url: 'https://microservice.dev',
            token: 'ABCDEF',
        };

        const testRouter: Router = new Router();
        testRouter.patch('/test', (ctx: Koa.Context) => {
            ctx.request.should.have.header('Authorization', `Bearer ${constants.TOKEN}`);
            ctx.request.body.should.have.property('data').and.deep.equal('test');
            ctx.request.body.should.have.property('loggedUser').and.deep.equal(constants.USER);
            ctx.body = 'ok';
        });

        app.use(koaBody());

        await microservice.register(registerOptions);

        app
            .use(testRouter.routes())
            .use(testRouter.allowedMethods());

        const server: Server = app.listen(3010);

        requester = chai.request(server).keepOpen();

        const response: Request.Response = await requester
            .patch('/test')
            .set('Authorization', `Bearer ${constants.TOKEN}`)
            .send({
                data: 'test'
            });

        response.status.should.equal(200);
        response.text.should.equal('ok');
    });

    it('PUT request with a JWT token in the header should fetch the user data and pass it along as loggedUser (happy case)', async () => {
        const app: Koa = new Koa2();

        const logger: Logger = bunyan.createLogger({
            name: 'logger name',
            src: true,
            streams: []
        });

        nock('https://controltower.dev')
             .post('/api/v1/microservice', {
                name: "test MS",
                url: "https://microservice.dev",
                active: true
            })
            .reply(200);

        nock('https://controltower.dev')
            .get('/auth/user/me')
            .reply(200, constants.USER);

        const registerOptions: RWAPIMicroservice.RegisterOptions = {
            info: { name: 'test MS' },
            swagger: { swagger: 'test swagger' },
            mode: microservice.MODE_AUTOREGISTER,
            framework: microservice.KOA2,
            app,
            logger,
            name: 'test MS',
            baseURL: 'https://controltower.dev',
            url: 'https://microservice.dev',
            token: 'ABCDEF',
        };

        const testRouter: Router = new Router();
        testRouter.put('/test', (ctx: Koa.Context) => {
            ctx.request.should.have.header('Authorization', `Bearer ${constants.TOKEN}`);
            ctx.request.body.should.have.property('data').and.deep.equal('test');
            ctx.request.body.should.have.property('loggedUser').and.deep.equal(constants.USER);
            ctx.body = 'ok';
        });

        app.use(koaBody());

        await microservice.register(registerOptions);

        app
            .use(testRouter.routes())
            .use(testRouter.allowedMethods());

        const server: Server = app.listen(3010);

        requester = chai.request(server).keepOpen();

        const response: Request.Response = await requester
            .put('/test')
            .set('Authorization', `Bearer ${constants.TOKEN}`)
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

