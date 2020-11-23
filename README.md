# RW API microservice utility for Nodejs applications

Library to register and integrate microservice in the [RW API](https://api.resourcewatch.org/).

Supports [Koa](https://koajs.com/) 2.x and 1.x frameworks. 

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
const RWAPIMicroservice = require('rw-api-microservice-node')

const promise = RWAPIMicroservice.register({
    info: info,
    swagger: swagger,
    logger: logger, 
    app: app,
    mode: 'auto',
    framework: ctRegisterMicroservice.KOA2,
    token: '<your control tower token>',
    ctUrl: '<your control tower instance URL>'
});

promise.then(function() {
    logger.info('Success!!!')
}, function(err) {
    logger.error(err);
    process.exit(1);
});
```
