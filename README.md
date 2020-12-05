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
    info: info,
    swagger: swagger,
    logger: logger,
    url: '<your microservice URL>',
    token: '<your control tower token>',
    baseURL: '<your control tower instance URL>'
}))

// Make sure you add your auth-depending routes *after* bootstraping this module

const server = app.listen(process.env.PORT, () => {
    // the register() method registers the MS on CT. Can only be used after calling bootstrap().
    RWAPIMicroservice.register().then(() => {
    }, (error) => {
        logger.error(error);
        process.exit(1);
    });
});
```


## Configuration

These are the values you'll need to provide when using this library:

- info: (**deprecated**) Object containing the microservice details. See [this link](https://github.com/resource-watch/dataset/blob/ab23e379362680e9899ac8f191589988f0b7c1cd/app/microservice/register.json) for an example.
- swagger: (**deprecated**) Object, in Swagger format, of the endpoints offered by the microservice to API end users.
- logger: a `bunyan` logger object, for logging purposes.
- name: the name of the service.
- baseURL: the URL of the API as a whole, where all other services will be reachable.
- url: the URL where your service will be reachable
- token: JWT token to use on calls to other services.
