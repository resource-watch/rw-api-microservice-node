# RW API microservice utility for Nodejs applications

[![Build Status](https://travis-ci.com/resource-watch/rw-api-microservice-node.svg?branch=main)](https://travis-ci.com/resource-watch/rw-api-microservice-node)
[![Test Coverage](https://api.codeclimate.com/v1/badges/ee1ee2cab3d50b46fcd1/test_coverage)](https://codeclimate.com/github/resource-watch/rw-api-microservice-node/test_coverage)

Library to register and integrate microservices in the [RW API](https://api.resourcewatch.org/).

Supports [Koa](https://koajs.com/) 2.x and 1.x frameworks.

## Requirements

- Nodejs v11 or greater

## Install

Using NPM:

````
npm install --save rw-api-microservice-node
````

Using Yarn:

````
yarn add rw-api-microservice-node
````

## Use in microservice

In the `listen` callback of your Koa application, add the following code snippet:

```javascript
const Koa = require('koa');
const RWAPIMicroservice = require('rw-api-microservice-node')

const app = new Koa();

app.use(RWAPIMicroservice.bootstrap({
  logger: logger,
  microserviceToken: '<your microservice token>',
  gatewayURL: '<your gateway URL>',
  fasltyEnabled: true,
  fastlyServiceId: '<your Fastly service id>',
  fastlyAPIKey: '<your Fastly API key>',
  awsRegion: '<your AWS region>',
  awsCloudWatchLogStreamName: '<your AWS CloudWatch log stream name>',
}))

// Make sure you add your auth-depending routes *after* bootstraping this module

const server = app.listen(process.env.PORT, () => {
  logger.info('Server started!');
});
```

## Configuration

These are the values you'll need to provide when using this library:

See [this link](https://docs.fastly.com/en/guides/finding-and-managing-your-account-info) for details on how to get
Fastly credentials.

| Argument name                  | Type          | Description                                                                                                                                         | Required?         | Default value    |
|--------------------------------|---------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|-------------------|------------------|
| logger                         | Object        | A `bunyan` logger object, for logging purposes                                                                                                      | yes               |                  |
| gatewayURL                     | string        | The URL of the API as a whole, where all other services will be reachable                                                                           | yes               |                  |
| microserviceToken              | string        | JWT token to use on calls to other services                                                                                                         | yes               |                  |
| skipAPIKeyRequirementEndpoints | Array<Object> | List of object containing a `method` and `pathRegex`. Incoming requests that match one of the elements on the list will bypass API Key requirement. | no                |                  |
| fastlyEnabled                  | boolean       | If set to `true`, the [Fastly](https://www.fastly.com/) integration will be enabled                                                                 | yes               |                  |
| fastlyServiceId                | string        | Access credentials to the [Fastly](https://www.fastly.com/) API                                                                                     | if Fastly enabled |                  |
| fastlyAPIKey                   | string        | Access credentials to the [Fastly](https://www.fastly.com/) API                                                                                     | if Fastly enabled |                  |
| requireAPIKey                  | boolean       | If API keys are required. If set to true, requests with no API key automatically get a HTTP 403 response.                                           | no                | true             |
| awsCloudWatchLoggingEnabled    | boolean       | If API key usage should be logged to AWS CloudWatch.                                                                                                | no                | true             |
| awsRegion                      | string        | Which AWS region to use when logging requests to AWS CloudWatch.                                                                                    | yes               |                  |
| awsCloudWatchLogGroupName      | string        | Which CloudWatch Log Group name to use when logging requests to AWS CloudWatch.                                                                     | no                | 'api-keys-usage' |
| awsCloudWatchLogStreamName     | string        | Which CloudWatch Log Stream name to use when logging requests to AWS CloudWatch.                                                                    | yes               |                  |

