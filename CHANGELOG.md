# v3.2.2

- Fix issue with GET/DELETE requests and [`koa-qs`](https://www.npmjs.com/package/koa-qs)

# v3.2.1

- Improve Fastly argument validation.

# v3.2.0

- Fix issue with `fastlyEnabled` set to "false" and Fastly configuration values validation.
- Improve typing for the arguments of the `bootstrap()` method.

# v3.1.2

- Support truthy string values for the `fastlyEnabled` configuration value.

# v3.1.1

- Restructure Fastly integration configuration variables.

# v3.1.0

- Make Fastly integration required.

# v3.0.3

- Add a custom version of `fastly-promises` to address security issue.

# v3.0.2

- Adjust logger level on failure of request to microservice.

# v3.0.1

- Update Axios to 0.21.1 to fix critical security issue.

# v3.0.0

- Add Fastly integration.

# v2.0.4

- Add support for `simple` and `resolveWithFullResponse` parameters on `requestToMicroservice`.

# v2.0.3

- Improved error handling when loading user data from token.

# v2.0.2

- Add `skipGetLoggedUser` temporary flag.

# v2.0.1

- Additional logging detail.
- Basic validation of boostrap values.
