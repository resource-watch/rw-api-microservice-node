import nock from "nock";
import chai, { expect } from 'chai';
import {
    ApplicationValidationResponse,
    LoggedUserValidationResponse,
    MicroserviceValidationResponse,
    UserValidationResponse
} from "./types";

chai.should();

export type mockValidateRequestArgType = {
    gatewayUrl: string,
    microserviceToken: string,
    user?: LoggedUserValidationResponse,
    application?: ApplicationValidationResponse,
    token?: string,
    apiKey?: string,
}

export const mockValidateRequest = ({
                                        gatewayUrl,
                                        microserviceToken,
                                        user = null,
                                        application = null,
                                        token = null,
                                        apiKey = null
                                    }: mockValidateRequestArgType): void => {
    const body: Record<string, any> = {};
    const response: Record<string, any> = {};

    if (user) {
        response.user = user;
    }
    if (application) {
        response.application = application;
    }
    if (token) {
        body.userToken = `Bearer ${token}`;
    }
    if (apiKey) {
        body.apiKey = apiKey;
    }

    nock(gatewayUrl, {
        reqheaders: {
            authorization: `Bearer ${microserviceToken}`,
        }
    })
        .post('/v1/request/validate', body)
        .reply(200, { user, application });
};


const mockCloudWatchCreateLogGroupRequest = (awsRegion: string, logGroupName: string): void => {
    nock(`https://logs.${awsRegion}.amazonaws.com:443`)
        .post('/', { logGroupName })
        .optionally()
        .reply(400, {
            "__type": "ResourceAlreadyExistsException",
            "message": "The specified log group already exists"
        });
}

const mockCloudWatchCreateLogStreamRequest = (awsRegion: string, logGroupName: string, logStreamName: string): void => {
    nock(`https://logs.${awsRegion}.amazonaws.com:443`)
        .post('/', { logGroupName, logStreamName })
        .optionally()
        .reply(400, {
            "__type": "ResourceAlreadyExistsException",
            "message": "The specified log stream already exists"
        });
}

const mockCloudWatchCreateLogLineRequest: ({
                                               application,
                                               user,
                                               awsRegion,
                                               logGroupName,
                                               logStreamName
                                           }: {
    application?: ApplicationValidationResponse;
    user?: LoggedUserValidationResponse,
    awsRegion?: string,
    logGroupName?: string,
    logStreamName?: string
}) => void = ({ application, user, awsRegion, logGroupName, logStreamName }): void => {
    nock(`https://logs.${awsRegion}.amazonaws.com:443`)
        .post('/', (body) => {
                expect(body).to.have.property('logGroupName').and.equal(logGroupName);
                expect(body).to.have.property('logStreamName').and.equal(logStreamName);
                expect(body).to.have.property('logEvents').and.be.an('array').and.lengthOf(1);
                expect(body.logEvents[0]).to.have.property('message').and.be.a('string');
                expect(body.logEvents[0]).to.have.property('timestamp').and.be.a('number');

                const logLine = JSON.parse(body.logEvents[0].message);

                expect(logLine).to.have.property('request');
                const requestLog = logLine.request;
                expect(requestLog).to.have.property('method').and.be.a('string').and.not.be.empty;
                expect(requestLog).to.have.property('path').and.be.a('string').and.not.be.empty;
                expect(requestLog).to.have.property('query').and.be.an('object');


                expect(logLine).to.have.property('requestApplication');
                const requestApplication = logLine.requestApplication;

                if (application) {
                    expect(requestApplication).to.deep.equal({
                        id: application.data.id,
                        apiKeyValue: application.data.attributes.apiKeyValue,
                        name: application.data.attributes.name,
                        organization: application.data.attributes.organization,
                        user: application.data.attributes.user
                    });
                } else {
                    expect(requestApplication).to.deep.equal({
                        id: 'anonymous',
                        name: 'anonymous',
                        organization: null,
                        user: null,
                        apiKeyValue: null,
                    });
                }

                expect(logLine).to.have.property('loggedUser');
                if (user) {
                    if (user.id === 'microservice') {
                        expect(logLine.loggedUser).to.deep.equal({
                            id: (user as MicroserviceValidationResponse).id,
                        });
                    } else {
                        expect(logLine.loggedUser).to.deep.equal({
                            id: (user as UserValidationResponse).id,
                            name: (user as UserValidationResponse).name,
                            role: (user as UserValidationResponse).role,
                            provider: (user as UserValidationResponse).provider
                        });
                    }
                } else {
                    expect(logLine.loggedUser).to.deep.equal({
                        id: 'anonymous',
                        name: 'anonymous',
                        role: 'anonymous',
                        provider: 'anonymous'
                    });
                }

                return true;
            }
        )
        .reply(200, { "nextSequenceToken": "49640528541606186274984579958467215700865662738895994946" });
}

export const mockCloudWatchLogRequest: ({
                                                     application,
                                                     user,
                                                     awsRegion,
                                                     logGroupName,
                                                     logStreamName
                                                 }?: {
    application?: ApplicationValidationResponse;
    user?: LoggedUserValidationResponse,
    logGroupName?: string,
    logStreamName?: string,
    awsRegion?: string
}) => void = ({
                  application,
                  user,
                  awsRegion = 'us-east-1',
                  logGroupName = 'api-keys-usage',
                  logStreamName = 'test'
              } = {}): void => {
    mockCloudWatchCreateLogLineRequest({ application, user, awsRegion, logGroupName, logStreamName });
}

export const mockCloudWatchSetupRequestsSequence: ({
                                                     awsRegion,
                                                     logGroupName,
                                                     logStreamName
                                                 }?: {
    logGroupName?: string,
    logStreamName?: string,
    awsRegion?: string
}) => void = ({
                  awsRegion = 'us-east-1',
                  logGroupName = 'api-keys-usage',
                  logStreamName = 'test'
              } = {}): void => {
    mockCloudWatchCreateLogGroupRequest(awsRegion, logGroupName);
    mockCloudWatchCreateLogStreamRequest(awsRegion, logGroupName, logStreamName);
}
