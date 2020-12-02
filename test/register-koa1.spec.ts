import nock from 'nock';
import chai from 'chai';

import microservice from 'main';
import type Logger from "bunyan";
import bunyan from "bunyan";
import type Koa from "koa";
// @ts-ignore
import Koa1 from "koa1";
import type RWAPIMicroservice from '../types';
import chaiHttp from 'chai-http';
import { Server } from "http";
import Request from "superagent";

chai.should();
chai.use(chaiHttp);

nock.disableNetConnect();
nock.enableNetConnect('127.0.0.1');

let requester: ChaiHttp.Agent;

describe('Microservice register - Koa v1.x', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        nock.cleanAll();
    });

    it('Microservice register without Koa v1 and auto-register should register the Koa middleware and make a call to the microservice endpoint on CT (happy case)', async () => {
        const app: Koa = new Koa1();

        app.middleware.should.have.length(0);

        const logger: Logger = bunyan.createLogger({
            name: 'logger name',
            src: true,
            streams: []
        });

        const registerOptions: RWAPIMicroservice.RegisterOptions = {
            info: { name: 'test MS' },
            swagger: { swagger: 'test swagger' },
            mode: microservice.MODE_NORMAL,
            framework: microservice.KOA1,
            app,
            logger,
            name: 'test MS',
            baseURL: 'https://controltower.dev',
            url: 'https://microservice.dev',
            token: 'ABCDEF',
        };

        await microservice.register(registerOptions);

        app.middleware.should.have.length(2);
    });

    it('Microservice register with Koa v1 and auto-register should register the Koa middleware and make a call to the microservice endpoint on CT (happy case)', async () => {
        const app: Koa = new Koa1();

        app.middleware.should.have.length(0);

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

        const registerOptions: RWAPIMicroservice.RegisterOptions = {
            info: { name: 'test MS' },
            swagger: { swagger: 'test swagger' },
            mode: microservice.MODE_AUTOREGISTER,
            framework: microservice.KOA1,
            app,
            logger,
            name: 'test MS',
            baseURL: 'https://controltower.dev',
            url: 'https://microservice.dev',
            token: 'ABCDEF',
        };

        await microservice.register(registerOptions);

        app.middleware.should.have.length(2);
    });

    it('Test registered /info endpoint returns the MS info (happy case)', async () => {
        const app: Koa = new Koa1();

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
            }).reply(200);

        const registerOptions: RWAPIMicroservice.RegisterOptions = {
            info: { name: 'test MS' },
            swagger: { swagger: 'test swagger' },
            mode: microservice.MODE_AUTOREGISTER,
            framework: microservice.KOA1,
            app,
            logger,
            name: 'test MS',
            baseURL: 'https://controltower.dev',
            url: 'https://microservice.dev',
            token: 'ABCDEF',
        };

        await microservice.register(registerOptions);

        const server: Server = app.listen(3010);

        requester = chai.request(server).keepOpen();

        const response: Request.Response = await requester.get('/info');

        response.status.should.equal(200);
        response.body.should.deep.equal({
            name: "test MS",
            swagger: {
                swagger: "test swagger"
            }
        });
    });

    it('Test registered /ping endpoint returns pong response (happy case)', async () => {
        const app: Koa = new Koa1();

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

        const registerOptions: RWAPIMicroservice.RegisterOptions = {
            info: { name: 'test MS' },
            swagger: { swagger: 'test swagger' },
            mode: microservice.MODE_AUTOREGISTER,
            framework: microservice.KOA1,
            app,
            logger,
            name: 'test MS',
            baseURL: 'https://controltower.dev',
            url: 'https://microservice.dev',
            token: 'ABCDEF',
        };

        await microservice.register(registerOptions);

        const server: Server = app.listen(3010);

        requester = chai.request(server).keepOpen();

        const response: Request.Response = await requester.get('/ping');

        response.status.should.equal(200);
        response.text.should.equal('pong');
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

