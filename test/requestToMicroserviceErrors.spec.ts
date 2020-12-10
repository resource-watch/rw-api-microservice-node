import nock from 'nock';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { RequestToMicroserviceOptions, RWAPIMicroservice } from "main";
import request from "request";
import { ResponseError } from "../src/response.error";

chai.should();
chai.use(chaiAsPromised);

nock.disableNetConnect();
nock.enableNetConnect('127.0.0.1');

describe('Request to RWAPIMicroservice with error responses', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        nock.cleanAll();
    });

    it('Basic requestToMicroservice - GET request with 404 response', async () => {
        const requestOptions: request.OptionsWithUri & RequestToMicroserviceOptions = {
            uri: `/dataset/1`,
            method: 'GET',
            json: true
        };

        nock('https://controltower.dev')
            .get('/dataset/1')
            .reply(404, {
                status: 404,
                detail: 'Endpoint not found'
            });

        await (RWAPIMicroservice.requestToMicroservice(requestOptions)).should.eventually.be.rejectedWith(ResponseError, '404 - {"status":404,"detail":"Endpoint not found"}');
    });

    it('Basic requestToMicroservice - GET request with 500 response', async () => {
        const requestOptions: request.OptionsWithUri & RequestToMicroserviceOptions = {
            uri: `/dataset/1`,
            method: 'GET',
            json: true
        };

        nock('https://controltower.dev')
            .get('/dataset/1')
            .reply(500, {
                status: 500,
                detail: 'Something went wrong'
            });

        await (RWAPIMicroservice.requestToMicroservice(requestOptions)).should.eventually.be.rejectedWith(ResponseError, '500 - {"status":500,"detail":"Something went wrong"}');
    });

    it('Basic requestToMicroservice - DELETE request with 404 response', async () => {
        const requestOptions: request.OptionsWithUri & RequestToMicroserviceOptions = {
            uri: `/dataset/1`,
            method: 'DELETE',
            json: true
        };

        nock('https://controltower.dev')
            .delete('/dataset/1')
            .reply(404, {
                status: 404,
                detail: 'Endpoint not found'
            });

        await (RWAPIMicroservice.requestToMicroservice(requestOptions)).should.eventually.be.rejectedWith(ResponseError, '404 - {"status":404,"detail":"Endpoint not found"}');
    });

    it('Basic requestToMicroservice - DELETE request with 500 response', async () => {
        const requestOptions: request.OptionsWithUri & RequestToMicroserviceOptions = {
            uri: `/dataset/1`,
            method: 'DELETE',
            json: true
        };

        nock('https://controltower.dev')
            .delete('/dataset/1')
            .reply(500, {
                status: 500,
                detail: 'Something went wrong'
            });

        await (RWAPIMicroservice.requestToMicroservice(requestOptions)).should.eventually.be.rejectedWith(ResponseError, '500 - {"status":500,"detail":"Something went wrong"}');
    });

    it('Basic requestToMicroservice - POST request with 500 response', async () => {
        const requestOptions: request.OptionsWithUri & RequestToMicroserviceOptions = {
            uri: `/dataset/1`,
            method: 'POST',
            json: true,
            body: {
                array: ['a', 'b', 'c']
            }
        };

        nock('https://controltower.dev')
            .post('/dataset/1', { array: ['a', 'b', 'c'] })
            .reply(404, {
                status: 404,
                detail: 'Endpoint not found'
            });

        await (RWAPIMicroservice.requestToMicroservice(requestOptions)).should.eventually.be.rejectedWith(ResponseError, '404 - {"status":404,"detail":"Endpoint not found"}');
    });

    it('Basic requestToMicroservice - POST request with 404 response', async () => {
        const requestOptions: request.OptionsWithUri & RequestToMicroserviceOptions = {
            uri: `/dataset/1`,
            method: 'POST',
            json: true,
            body: {
                array: ['a', 'b', 'c']
            }
        };

        nock('https://controltower.dev')
            .post('/dataset/1', { array: ['a', 'b', 'c'] })
            .reply(500, {
                status: 500,
                detail: 'Something went wrong'
            });

        await (RWAPIMicroservice.requestToMicroservice(requestOptions)).should.eventually.be.rejectedWith(ResponseError, '500 - {"status":500,"detail":"Something went wrong"}');
    });

    it('Basic requestToMicroservice - PUT request with 500 response', async () => {
        const requestOptions: request.OptionsWithUri & RequestToMicroserviceOptions = {
            uri: `/dataset/1`,
            method: 'PUT',
            json: true,
            body: {
                array: ['a', 'b', 'c']
            }
        };

        nock('https://controltower.dev')
            .put('/dataset/1', { array: ['a', 'b', 'c'] })
            .reply(404, {
                status: 404,
                detail: 'Endpoint not found'
            });

        await (RWAPIMicroservice.requestToMicroservice(requestOptions)).should.eventually.be.rejectedWith(ResponseError, '404 - {"status":404,"detail":"Endpoint not found"}');
    });

    it('Basic requestToMicroservice - PUT request with 404 response', async () => {
        const requestOptions: request.OptionsWithUri & RequestToMicroserviceOptions = {
            uri: `/dataset/1`,
            method: 'PUT',
            json: true,
            body: {
                array: ['a', 'b', 'c']
            }
        };

        nock('https://controltower.dev')
            .put('/dataset/1', { array: ['a', 'b', 'c'] })
            .reply(500, {
                status: 500,
                detail: 'Something went wrong'
            });

        await (RWAPIMicroservice.requestToMicroservice(requestOptions)).should.eventually.be.rejectedWith(ResponseError, '500 - {"status":500,"detail":"Something went wrong"}');
    });

    it('Basic requestToMicroservice - PATCH request with 500 response', async () => {
        const requestOptions: request.OptionsWithUri & RequestToMicroserviceOptions = {
            uri: `/dataset/1`,
            method: 'PATCH',
            json: true,
            body: {
                array: ['a', 'b', 'c']
            }
        };

        nock('https://controltower.dev')
            .patch('/dataset/1', { array: ['a', 'b', 'c'] })
            .reply(404, {
                status: 404,
                detail: 'Endpoint not found'
            });

        await (RWAPIMicroservice.requestToMicroservice(requestOptions)).should.eventually.be.rejectedWith(ResponseError, '404 - {"status":404,"detail":"Endpoint not found"}');
    });

    it('Basic requestToMicroservice - PATCH request with 404 response', async () => {
        const requestOptions: request.OptionsWithUri & RequestToMicroserviceOptions = {
            uri: `/dataset/1`,
            method: 'PATCH',
            json: true,
            body: {
                array: ['a', 'b', 'c']
            }
        };

        nock('https://controltower.dev')
            .patch('/dataset/1', { array: ['a', 'b', 'c'] })
            .reply(500, {
                status: 500,
                detail: 'Something went wrong'
            });

        await (RWAPIMicroservice.requestToMicroservice(requestOptions)).should.eventually.be.rejectedWith(ResponseError, '500 - {"status":500,"detail":"Something went wrong"}');
    });

    it('GET requestToMicroservice with resolveWithFullResponse=true and with 404 response', async () => {
        const requestOptions: request.OptionsWithUri & RequestToMicroserviceOptions = {
            uri: `/dataset/1`,
            method: 'GET',
            json: true,
            resolveWithFullResponse: true
        };

        nock('https://controltower.dev')
            .get('/dataset/1')
            .reply(404, 'Not found');

        const response: Record<string, any> = await RWAPIMicroservice.requestToMicroservice(requestOptions);

        response.should.have.property('body').and.equal('Not found');
        response.should.have.property('statusCode').and.equal(404);
    });

    it('GET requestToMicroservice with resolveWithFullResponse=true and with 500 response', async () => {
        const requestOptions: request.OptionsWithUri & RequestToMicroserviceOptions = {
            uri: `/dataset/1`,
            method: 'GET',
            json: true,
            resolveWithFullResponse: true
        };

        nock('https://controltower.dev')
            .get('/dataset/1')
            .reply(500, 'Server error');

        const response: Record<string, any> = await RWAPIMicroservice.requestToMicroservice(requestOptions);

        response.should.have.property('body').and.equal('Server error');
        response.should.have.property('statusCode').and.equal(500);
    });

    it('GET requestToMicroservice with simple=false and with 404 response', async () => {
        const requestOptions: request.OptionsWithUri & RequestToMicroserviceOptions = {
            uri: `/dataset/1`,
            method: 'GET',
            json: true,
            simple: false
        };

        nock('https://controltower.dev')
            .get('/dataset/1')
            .reply(404, 'Not found');

        const response: Record<string, any> = await RWAPIMicroservice.requestToMicroservice(requestOptions);

        response.should.equal('Not found');
    });

    it('GET requestToMicroservice with simple=false and with 500 response', async () => {
        const requestOptions: request.OptionsWithUri & RequestToMicroserviceOptions = {
            uri: `/dataset/1`,
            method: 'GET',
            json: true,
            simple: false
        };

        nock('https://controltower.dev')
            .get('/dataset/1')
            .reply(500, {
                status: 500,
                detail: 'Something went wrong'
            });

        await (RWAPIMicroservice.requestToMicroservice(requestOptions)).should.eventually.be.rejectedWith(ResponseError, '500 - {"status":500,"detail":"Something went wrong"}');
    });

    it('GET requestToMicroservice with simple=false and resolveWithFullResponse=true and with 404 response', async () => {
        const requestOptions: request.OptionsWithUri & RequestToMicroserviceOptions = {
            uri: `/dataset/1`,
            method: 'GET',
            json: true,
            simple: false,
            resolveWithFullResponse: true
        };

        nock('https://controltower.dev')
            .get('/dataset/1')
            .reply(404, 'Not found');

        const response: Record<string, any> = await RWAPIMicroservice.requestToMicroservice(requestOptions);

        response.should.have.property('body').and.equal('Not found');
        response.should.have.property('statusCode').and.equal(404);
    });

    it('GET requestToMicroservice with simple=false and resolveWithFullResponse=true and with 500 response', async () => {
        const requestOptions: request.OptionsWithUri & RequestToMicroserviceOptions = {
            uri: `/dataset/1`,
            method: 'GET',
            json: true,
            simple: false,
            resolveWithFullResponse: true
        };

        nock('https://controltower.dev')
            .get('/dataset/1')
            .reply(500, 'Server error');

        const response: Record<string, any> = await RWAPIMicroservice.requestToMicroservice(requestOptions);

        response.should.have.property('body').and.equal('Server error');
        response.should.have.property('statusCode').and.equal(500);
    });

    afterEach(() => {
        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});

