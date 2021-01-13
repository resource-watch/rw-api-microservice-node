import nock from 'nock';
import chai from 'chai';
import type { BootstrapArguments } from 'main';
import { RWAPIMicroservice } from 'main';
import type Logger from "bunyan";
import bunyan from "bunyan";
import type Koa from "koa";
// @ts-ignore
import Koa2 from "koa2";
import type { Server } from "http";
import type Request from "superagent";
import ChaiHttp from 'chai-http';

chai.should();

nock.disableNetConnect();
nock.enableNetConnect('127.0.0.1');

let requester: ChaiHttp.Agent;

describe('RWAPIMicroservice register - Koa v2.x', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        nock.cleanAll();
    });

    it('RWAPIMicroservice register with Koa v2 and auto-register should register the Koa middleware and make a call to the RWAPIMicroservice endpoint on CT (happy case)', async () => {
        const app: Koa = new Koa2();

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

        app.use(RWAPIMicroservice.bootstrap(registerOptions));
        await RWAPIMicroservice.register();

        app.middleware.should.have.length(1);
    });

    it('Test registered /info endpoint returns the MS info (happy case)', async () => {
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

        app.use(RWAPIMicroservice.bootstrap(registerOptions));
        await RWAPIMicroservice.register();

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

        app.use(RWAPIMicroservice.bootstrap(registerOptions));
        await RWAPIMicroservice.register();

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

