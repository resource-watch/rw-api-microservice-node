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
  gatewayURL: '<your gateway URL>'
}))

// Make sure you add your auth-depending routes *after* bootstraping this module

const server = app.listen(process.env.PORT, () => {
    logger.info('Server started!');
});
```


## Configuration

These are the values you'll need to provide when using this library:

- logger: a `bunyan` logger object, for logging purposes.
- gatewayURL: the URL of the API as a whole, where all other services will be reachable.
- microserviceToken: JWT token to use on calls to other services.
- skipGetLoggedUser: if set to `true`, the library will not intercept `authorization` headers nor fetch and inject the associated user data. Meant to be used by the user service. 
- fastlyEnabled: if set to `true`, the [Fastly](https://www.fastly.com/) integration will be enabled.
- fastlyServiceId and fastlyAPIKey: data for the Fastly integration. See [this link](https://docs.fastly.com/en/guides/finding-and-managing-your-account-info) for details on how to get these values. These values are required if `fastlyEnabled` is `true`.
