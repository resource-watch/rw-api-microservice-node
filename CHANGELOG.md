# v5.1.1

- Minor improvement to testing helper function.

# v5.1.0

- Add TypeScript dependencies

# v5.1.0-rc4

- Add missing dev dependencies

# v5.1.0-rc2

- Fix issue with AWS SDK library update.

# v5.1.0-rc1

- Bump nodejs version requirement to >=18
- Update AWS SDK library to v3
- Update dependencies

# v5.0.0-rc7

- Replace whitespaces in log group and stream names.
- Fix issue in loading user data
- Allow microservice requests to be made without an api key

# v5.0.0-rc6

- Move `requestApplication` into context state.

# v5.0.0-rc5

- Improvements to AWS CloudWatch logging mocks.

# v5.0.0-rc4

- Fix bug in API Key validation logic when making calls to `requestToMicroservice`.

# v5.0.0-rc3

- Modify `requireAPIKey` logic.
- Add API Key validation logic when making calls to `requestToMicroservice`.

# v5.0.0-rc1

- Make application logging to AWS CloudWatch more flexible.

# v5.0.0-beta6

- Add request details logging to AWS CloudWatch.

# v5.0.0-beta5

- Fix issue with validation request URL.

# v5.0.0-beta4

- Add `skipAPIKeyRequirementEndpoints` configuration parameter.
- Add mock helper functions for ease of microservice testing.
- Split and extend types.

# v5.0.0-beta3

- Replace `skipGetLoggedUser` flag with request validation endpoint detection logic.
- Explicitly log anonymous requests.

# v5.0.0-beta2

- Fix issue with absolute path imports.

# v5.0.0-beta1

- Add API key tracking and usage logging.
  - Add API key capturing from HTTP headers
  - Library uses POST /api/v1/request/validate to load API key and user data
  - API key is now logged to AWS CloudWatch
- Update dependencies.

# v4.0.7

- Rollback `@types/koa` and `@types/koa-router`
- Fix issue 

# v4.0.6

- Add `params` argument to `requestToMicroservice`.
- Update `fastly-prmomises`, `axios` and dev dependencies to address underlying vulnerabilities.

# v4.0.5

- Drop support for nodejs v11.
- Update dependencies to address underlying vulnerabilities.

# v4.0.3

- Update `axios`

# v4.0.1

- Restore `skipGetLoggedUser` flag as permanent functionality.

# v4.0.0

- Remove Control Tower support
- `requestToMicroservice` no longer prefixes request uris with `/v1`
- Remove `/info` and `/ping` endpoints

# v3.4.1

- Add `access-control-allow-headers: upgrade-insecure-requests` CORS header

# v3.4.0

- Add CORS headers

# v3.3.3

- Fix tests for handling `getLoggedUser()` error scenarios

# v3.3.2

- Fix issue when handling invalid/outdated token

# v3.3.1

- Fix issue with Fastly header handling.

# v3.3.0

- Remove support for `authentication: <token>` headers in favor of `authorization: Bearer <token>`

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
