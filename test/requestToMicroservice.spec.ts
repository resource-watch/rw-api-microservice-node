import nock from 'nock';
import chai from 'chai';

import microservice from 'main';
import type RWAPIMicroservice from '../types';
import request from "request";

chai.should();

nock.disableNetConnect();
nock.enableNetConnect('127.0.0.1');

describe('Request to microservice', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        nock.cleanAll();
    });

    it('Basic requestToMicroservice - GET request (happy case)', async () => {
        const requestOptions: request.OptionsWithUri & RWAPIMicroservice.RequestToMicroserviceOptions = {
            uri: `/dataset/1`,
            method: 'GET',
            json: true
        };

        nock('https://controltower.dev')
            .get('/dataset/1')
            .reply(200, 'ok');

        const response = await microservice.requestToMicroservice(requestOptions);

        response.should.equal('ok');
    });

    it('Basic requestToMicroservice - POST request (happy case)', async () => {
        const requestOptions: request.OptionsWithUri & RWAPIMicroservice.RequestToMicroserviceOptions = {
            uri: `/dataset/1`,
            method: 'POST',
            json: true,
            body: {
                array: ['a', 'b', 'c']
            }
        };

        nock('https://controltower.dev')
            .post('/dataset/1', { array: ['a', 'b', 'c'] })
            .reply(200, 'ok');

        const response = await microservice.requestToMicroservice(requestOptions);

        response.should.equal('ok');
    });

    it('requestToMicroservice GET request with token should pass the token along', async () => {
        const requestOptions: request.OptionsWithUri & RWAPIMicroservice.RequestToMicroserviceOptions = {
            uri: `/dataset/1`,
            method: 'GET',
            json: true
        };

        nock('https://controltower.dev', { reqheaders: { authentication: 'token' } })
            .get('/dataset/1')
            .reply(200, 'ok');

        microservice.options.token = 'token'

        const response = await microservice.requestToMicroservice(requestOptions);

        response.should.equal('ok');
    });

    it('requestToMicroservice DELETE request with token should pass the token along', async () => {
        const requestOptions: request.OptionsWithUri & RWAPIMicroservice.RequestToMicroserviceOptions = {
            uri: `/dataset/1`,
            method: 'DELETE',
            json: true
        };

        nock('https://controltower.dev', { reqheaders: { authentication: 'token' } })
            .delete('/dataset/1')
            .reply(200, 'ok');

        microservice.options.token = 'token'

        const response = await microservice.requestToMicroservice(requestOptions);

        response.should.equal('ok');
    });

    it('requestToMicroservice POST request with token should pass the token along', async () => {
        const requestOptions: request.OptionsWithUri & RWAPIMicroservice.RequestToMicroserviceOptions = {
            uri: `/dataset/1`,
            method: 'POST',
            json: true,
            body: {
                array: ['a', 'b', 'c']
            }
        };

        nock('https://controltower.dev', { reqheaders: { authentication: 'token' } })
            .post('/dataset/1', { array: ['a', 'b', 'c'] })
            .reply(200, 'ok');

        microservice.options.token = 'token'


        const response = await microservice.requestToMicroservice(requestOptions);

        response.should.equal('ok');
    });

    it('requestToMicroservice PATCH request with token should pass the token along', async () => {
        const requestOptions: request.OptionsWithUri & RWAPIMicroservice.RequestToMicroserviceOptions = {
            uri: `/dataset/1`,
            method: 'PATCH',
            json: true,
            body: {
                array: ['a', 'b', 'c']
            }
        };

        nock('https://controltower.dev', { reqheaders: { authentication: 'token' } })
            .patch('/dataset/1', { array: ['a', 'b', 'c'] })
            .reply(200, 'ok');

        microservice.options.token = 'token'


        const response = await microservice.requestToMicroservice(requestOptions);

        response.should.equal('ok');
    });

    it('requestToMicroservice PUT request with token should pass the token along', async () => {
        const requestOptions: request.OptionsWithUri & RWAPIMicroservice.RequestToMicroserviceOptions = {
            uri: `/dataset/1`,
            method: 'PUT',
            json: true,
            body: {
                array: ['a', 'b', 'c']
            }
        };

        nock('https://controltower.dev', { reqheaders: { authentication: 'token' } })
            .put('/dataset/1', { array: ['a', 'b', 'c'] })
            .reply(200, 'ok');

        microservice.options.token = 'token'


        const response = await microservice.requestToMicroservice(requestOptions);

        response.should.equal('ok');
    });

    afterEach(() => {
        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});

