import nock from "nock";
import constants from "./test.constants";
import chai, { expect } from 'chai';

chai.should();

type mockValidateRequestArgType = {
    user?: Record<string, any>,
    application?: Record<string, any>,
    token?: string,
    apiKey?: string,
}

const mockValidateRequest = ({
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

    nock('https://controltower.dev', {
        reqheaders: {
            authorization: `Bearer ${constants.MICROSERVICE_TOKEN}`,
        }
    })
        .post('/api/v1/request/validate', body)
        .reply(200, { user, application });
};


export const mockValidateRequestWithUserToken = (user = constants.USER, token = constants.USER_TOKEN): void => {
    mockValidateRequest({ user, token });
};

export const mockValidateRequestWithApiKey = (apiKey = 'api-key-test', application = constants.APPLICATION): void => {
    mockValidateRequest({ apiKey, application });
};

export const mockValidateRequestWithApiKeyAndUserToken = (apiKey = 'api-key-test', token = constants.USER_TOKEN, application = constants.APPLICATION, user = constants.USER): void => {
    mockValidateRequest({ apiKey, application, user, token });
};

const mockCloudWatchCreateLogGroupRequest = (): void => {
    nock('https://logs.eu-west-1.amazonaws.com:443', { "encodedQueryParams": true })
        .post('/', { logGroupName: 'api-keys-usage' })
        .optionally()
        .reply(400, {
            "__type": "ResourceAlreadyExistsException",
            "message": "The specified log group already exists"
        });
}

const mockCloudWatchCreateLogStreamRequest = (): void => {
    nock('https://logs.eu-west-1.amazonaws.com:443')
        .post('/', { "logGroupName": "api-keys-usage", "logStreamName": "test" })
        .optionally()
        .reply(400, {
            "__type": "ResourceAlreadyExistsException",
            "message": "The specified log stream already exists"
        });
}

const mockCloudWatchCreateLogLineRequest: ({ application, user }: {
    application?: Record<string, any>;
    user?: Record<string, any>
}) => void = ({ application, user }): void => {
    nock('https://logs.eu-west-1.amazonaws.com:443')
        .post('/', (body) => {
                expect(body).to.have.property('logGroupName').and.equal('api-keys-usage');
                expect(body).to.have.property('logStreamName').and.equal('test');
                expect(body).to.have.property('logEvents').and.be.an('array').and.lengthOf(1);
                expect(body.logEvents[0]).to.have.property('message').and.be.a('string');
                expect(body.logEvents[0]).to.have.property('timestamp').and.be.a('number');

                const logLine = JSON.parse(body.logEvents[0].message);

                if (body.requestApplication || application) {
                    expect(logLine).to.have.property('requestApplication');
                    const requestApplication = logLine.requestApplication;
                    expect(requestApplication).to.deep.equal({
                        id: application.data.id,
                        apiKeyValue: application.data.attributes.apiKeyValue,
                        name: application.data.attributes.name,
                        organization: application.data.attributes.organization,
                        user: application.data.attributes.user
                    });
                }


                if (body.loggedUser || user) {
                    expect(logLine).to.have.property('loggedUser');
                    if (user.id === 'microservice') {
                        expect(logLine.loggedUser).to.deep.equal({
                            id: user.id,
                        });
                    } else {
                        expect(logLine.loggedUser).to.deep.equal({
                            id: user.id,
                            name: user.name,
                            role: user.role,
                            provider: user.provider
                        });
                    }
                }

                return true;
            }
        )
        .reply(200, { "nextSequenceToken": "49640528541606186274984579958467215700865662738895994946" });
}

export const mockCloudWatchLogRequestsSequence: ({ application, user }: {
    application?: Record<string, any>;
    user?: Record<string, any>
}) => void = ({ application, user }): void => {
    mockCloudWatchCreateLogGroupRequest();
    mockCloudWatchCreateLogStreamRequest();
    mockCloudWatchCreateLogLineRequest({ application, user });
}
