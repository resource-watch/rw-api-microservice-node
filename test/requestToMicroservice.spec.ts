import nock from 'nock';
import chai from 'chai';
import { RequestToMicroserviceOptions, RWAPIMicroservice } from "main";
import request from "request";

chai.should();

nock.disableNetConnect();
nock.enableNetConnect('127.0.0.1');

describe('Request to RWAPIMicroservice', () => {

    before(nock.cleanAll);

    it('Basic requestToMicroservice - GET request (happy case)', async () => {
        const requestOptions: request.OptionsWithUri & RequestToMicroserviceOptions = {
            uri: `/v1/dataset/1`,
            method: 'GET',
            json: true
        };

        nock('https://controltower.dev')
            .get('/v1/dataset/1')
            .reply(200, 'ok');

        const response: Record<string, any> = await RWAPIMicroservice.requestToMicroservice(requestOptions);

        response.should.equal('ok');
    });

    it('GET requestToMicroservice with resolveWithFullResponse=true', async () => {
        const requestOptions: request.OptionsWithUri & RequestToMicroserviceOptions = {
            uri: `/v1/dataset/1`,
            method: 'GET',
            json: true,
            resolveWithFullResponse: true
        };

        nock('https://controltower.dev')
            .get('/v1/dataset/1')
            .reply(200, 'ok');

        const response: Record<string, any> = await RWAPIMicroservice.requestToMicroservice(requestOptions);

        response.should.have.property('body').and.equal('ok');
        response.should.have.property('statusCode').and.equal(200);
    });

    it('GET requestToMicroservice with simple=false', async () => {
        const requestOptions: request.OptionsWithUri & RequestToMicroserviceOptions = {
            uri: `/v1/dataset/1`,
            method: 'GET',
            json: true,
            simple: false
        };

        nock('https://controltower.dev')
            .get('/v1/dataset/1')
            .reply(200, 'ok');

        const response: Record<string, any> = await RWAPIMicroservice.requestToMicroservice(requestOptions);

        response.should.equal('ok');
    });

    it('GET requestToMicroservice with simple=false and resolveWithFullResponse=true', async () => {
        const requestOptions: request.OptionsWithUri & RequestToMicroserviceOptions = {
            uri: `/v1/dataset/1`,
            method: 'GET',
            json: true,
            simple: false,
            resolveWithFullResponse: true
        };

        nock('https://controltower.dev')
            .get('/v1/dataset/1')
            .reply(200, 'ok');

        const response: Record<string, any> = await RWAPIMicroservice.requestToMicroservice(requestOptions);

        response.should.have.property('body').and.equal('ok');
        response.should.have.property('statusCode').and.equal(200);
    });

    it('Basic requestToMicroservice - POST request (happy case)', async () => {
        const requestOptions: request.OptionsWithUri & RequestToMicroserviceOptions = {
            uri: `/v1/dataset/1`,
            method: 'POST',
            json: true,
            body: {
                array: ['a', 'b', 'c']
            }
        };

        nock('https://controltower.dev')
            .post('/v1/dataset/1', { array: ['a', 'b', 'c'] })
            .reply(200, 'ok');

        const response: Record<string, any> = await RWAPIMicroservice.requestToMicroservice(requestOptions);

        response.should.equal('ok');
    });

    it('requestToMicroservice GET request with microserviceToken should pass the token along', async () => {
        const requestOptions: request.OptionsWithUri & RequestToMicroserviceOptions = {
            uri: `/v1/dataset/1`,
            method: 'GET',
            json: true
        };

        nock('https://controltower.dev', { reqheaders: { authorization: 'Bearer token' } })
            .get('/v1/dataset/1')
            .reply(200, 'ok');

        RWAPIMicroservice.options.microserviceToken = 'token';

        const response: Record<string, any> = await RWAPIMicroservice.requestToMicroservice(requestOptions);

        response.should.equal('ok');
    });

    it('requestToMicroservice DELETE request with microserviceToken should pass the token along', async () => {
        const requestOptions: request.OptionsWithUri & RequestToMicroserviceOptions = {
            uri: `/v1/dataset/1`,
            method: 'DELETE',
            json: true
        };

        nock('https://controltower.dev', { reqheaders: { authorization: 'Bearer token' } })
            .delete('/v1/dataset/1')
            .reply(200, 'ok');

        RWAPIMicroservice.options.microserviceToken = 'token';

        const response: Record<string, any> = await RWAPIMicroservice.requestToMicroservice(requestOptions);

        response.should.equal('ok');
    });

    it('requestToMicroservice POST request with microserviceToken should pass the token along', async () => {
        const requestOptions: request.OptionsWithUri & RequestToMicroserviceOptions = {
            uri: `/v1/dataset/1`,
            method: 'POST',
            json: true,
            body: {
                array: ['a', 'b', 'c']
            }
        };

        nock('https://controltower.dev', { reqheaders: { authorization: 'Bearer token' } })
            .post('/v1/dataset/1', { array: ['a', 'b', 'c'] })
            .reply(200, 'ok');

        RWAPIMicroservice.options.microserviceToken = 'token';


        const response: Record<string, any> = await RWAPIMicroservice.requestToMicroservice(requestOptions);

        response.should.equal('ok');
    });

    it('requestToMicroservice PATCH request with microserviceToken should pass the token along', async () => {
        const requestOptions: request.OptionsWithUri & RequestToMicroserviceOptions = {
            uri: `/v1/dataset/1`,
            method: 'PATCH',
            json: true,
            body: {
                array: ['a', 'b', 'c']
            }
        };

        nock('https://controltower.dev', { reqheaders: { authorization: 'Bearer token' } })
            .patch('/v1/dataset/1', { array: ['a', 'b', 'c'] })
            .reply(200, 'ok');

        RWAPIMicroservice.options.microserviceToken = 'token';


        const response: Record<string, any> = await RWAPIMicroservice.requestToMicroservice(requestOptions);

        response.should.equal('ok');
    });

    it('requestToMicroservice PUT request with microserviceToken should pass the token along', async () => {
        const requestOptions: request.OptionsWithUri & RequestToMicroserviceOptions = {
            uri: `/v1/dataset/1`,
            method: 'PUT',
            json: true,
            body: {
                array: ['a', 'b', 'c']
            }
        };

        nock('https://controltower.dev', { reqheaders: { authorization: 'Bearer token' } })
            .put('/v1/dataset/1', { array: ['a', 'b', 'c'] })
            .reply(200, 'ok');

        RWAPIMicroservice.options.microserviceToken = 'token';


        const response: Record<string, any> = await RWAPIMicroservice.requestToMicroservice(requestOptions);

        response.should.equal('ok');
    });

    afterEach(() => {
        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});

