import nock from 'nock';
import chai  from 'chai';
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

/**
 * This whole file can be deleted once the Authorization MS no longer needs to rely on CT's routing. See main.ts for more details.
 */
describe('Injecting logged user data - Koa v2.x with skipGetLoggedUser', () => {

    before(nock.cleanAll);

    it('GET request with a JWT token in the header and skipGetLoggedUser=true should fetch the user data and pass it along as loggedUser (happy case)', async () => {
        const app: Koa = new Koa2();

        const logger: Logger = bunyan.createLogger({
            name: 'logger name',
            src: true,
            streams: []
        });

        const registerOptions: BootstrapArguments = {
            logger,
            gatewayURL: 'https://controltower.dev',
            microserviceToken: 'ABCDEF',
            skipGetLoggedUser: true,
            fastlyEnabled: false
        };

        const testRouter: Router = new Router();
        testRouter.get('/test', (ctx: Koa.Context) => {
            ctx.request.should.have.header('Authorization', `Bearer ${constants.TOKEN}`);
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


        response.status.should.equal(200);
        response.text.should.equal('ok');
    });

    it('DELETE request with a JWT token in the header and skipGetLoggedUser=true should fetch the user data and pass it along as loggedUser (happy case)', async () => {
        const app: Koa = new Koa2();

        const logger: Logger = bunyan.createLogger({
            name: 'logger name',
            src: true,
            streams: []
        });

        const registerOptions: BootstrapArguments = {
            logger,
            gatewayURL: 'https://controltower.dev',
            microserviceToken: 'ABCDEF',
            skipGetLoggedUser: true,
            fastlyEnabled: false
        };

        const testRouter: Router = new Router();
        testRouter.delete('/test', (ctx: Koa.Context) => {
            ctx.request.should.have.header('Authorization', `Bearer ${constants.TOKEN}`);
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
            .set('Authorization', `Bearer ${constants.TOKEN}`);


        response.status.should.equal(200);
        response.text.should.equal('ok');
    });

    it('POST request with a JWT token in the header and skipGetLoggedUser=true should fetch the user data and pass it along as loggedUser (happy case)', async () => {
        const app: Koa = new Koa2();

        const logger: Logger = bunyan.createLogger({
            name: 'logger name',
            src: true,
            streams: []
        });

        const registerOptions: BootstrapArguments = {
            logger,
            gatewayURL: 'https://controltower.dev',
            microserviceToken: 'ABCDEF',
            skipGetLoggedUser: true,
            fastlyEnabled: false
        };

        const testRouter: Router = new Router();
        testRouter.post('/test', (ctx: Koa.Context) => {
            ctx.request.should.have.header('Authorization', `Bearer ${constants.TOKEN}`);
            ctx.request.body.should.have.property('data').and.deep.equal('test');
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
            .set('Authorization', `Bearer ${constants.TOKEN}`)
            .send({
                data: 'test'
            });

        response.status.should.equal(200);
        response.text.should.equal('ok');
    });

    it('PATCH request with a JWT token in the header and skipGetLoggedUser=true should fetch the user data and pass it along as loggedUser (happy case)', async () => {
        const app: Koa = new Koa2();

        const logger: Logger = bunyan.createLogger({
            name: 'logger name',
            src: true,
            streams: []
        });

        const registerOptions: BootstrapArguments = {
            logger,
            gatewayURL: 'https://controltower.dev',
            microserviceToken: 'ABCDEF',
            skipGetLoggedUser: true,
            fastlyEnabled: false
        };

        const testRouter: Router = new Router();
        testRouter.patch('/test', (ctx: Koa.Context) => {
            ctx.request.should.have.header('Authorization', `Bearer ${constants.TOKEN}`);
            ctx.request.body.should.have.property('data').and.deep.equal('test');
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
            .set('Authorization', `Bearer ${constants.TOKEN}`)
            .send({
                data: 'test'
            });

        response.status.should.equal(200);
        response.text.should.equal('ok');
    });

    it('PUT request with a JWT token in the header and skipGetLoggedUser=true should fetch the user data and pass it along as loggedUser (happy case)', async () => {
        const app: Koa = new Koa2();

        const logger: Logger = bunyan.createLogger({
            name: 'logger name',
            src: true,
            streams: []
        });

        const registerOptions: BootstrapArguments = {
            logger,
            gatewayURL: 'https://controltower.dev',
            microserviceToken: 'ABCDEF',
            skipGetLoggedUser: true,
            fastlyEnabled: false
        };

        const testRouter: Router = new Router();
        testRouter.put('/test', (ctx: Koa.Context) => {
            ctx.request.should.have.header('Authorization', `Bearer ${constants.TOKEN}`);
            ctx.request.body.should.have.property('data').and.deep.equal('test');
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

