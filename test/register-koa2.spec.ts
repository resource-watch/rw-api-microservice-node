import nock from 'nock';
import chai from 'chai';

import microservice from 'main';
import bunyan from "bunyan";
// @ts-ignore
import Koa from "koa2";
import type RWAPIMicroservice from '../types';

chai.should();

nock.disableNetConnect();

describe('Microservice register - Koa v2.x', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        nock.cleanAll();
    });

    it('Microservice register v2 (happy case)', async () => {
        const app = new Koa();

        app.middleware.should.have.length(0);

        const logger = bunyan.createLogger({
            name: 'logger name',
            src: true,
            streams: []
        });

        nock('https://controltower.dev')
            .post('/api/v1/microservice', (body) => {
                return body ===
                    {
                        "name": "test MS",
                        "url": "https://microservice.dev",
                        "active": true
                    };
            })
            .reply(200);

        const registerOptions: RWAPIMicroservice.RegisterOptions = {
            info: { name: 'test MS' },
            swagger: { swagger: 'test swagger' },
            mode: microservice.MODE_AUTOREGISTER,
            framework: microservice.KOA2,
            app,
            logger,
            name: 'test MS',
            ctUrl: 'https://controltower.dev',
            url: 'https://microservice.dev',
            token: 'ABCDEF',
            active: true
        };

        await microservice.register(registerOptions)

        app.middleware.should.have.length(1);
    });


    afterEach(() => {
        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});

