suite("signature validation", function() {
  var Promise     = require('promise');
  var assert      = require('assert');
  var debug       = require('debug')('test:auth');
  var helper      = require('./helper');
  var slugid      = require('slugid');
  var _           = require('lodash');
  var assume      = require('assume');
  var base        = require('taskcluster-base');
  var taskcluster = require('taskcluster-client');

  let credentials = {
    clientId: 'tester',
    accessToken: 'no-secret',
  };

  let badcreds = {
    clientId: 'tester',
    accessToken: 'wrong',
  };

  let testAuth = (name, {config, requiredScopes, clientScopes, errorCode}) => {
    test(name, async () => {
      let auth = new helper.Auth(config);
      await auth.testAuthenticate({requiredScopes, clientScopes}).then(() => {
        assert(!errorCode, "Request was successful, but expected an error " +
                           "with code: " + errorCode);
      }, err => {
        assert(errorCode, "Request failed!");
        assert(err.code === errorCode, "Expected error with code: " +
                                       errorCode + " but got: " + err.code);
      });
    });
  };


  testAuth('valid creds', {
    config: {credentials},
    requiredScopes: ['test-scope:test'],
    clientScopes: ['test-scope:test'],
  });



  testAuth('valid creds (star scope)', {
    config: {credentials},
    requiredScopes: ['test-scope:test'],
    clientScopes: ['test-scope:*'],
  });

  testAuth('valid creds (scope subset)', {
    config: {credentials},
    requiredScopes: ['test-scope:test2'],
    clientScopes: ['test-scope:test1', 'test-scope:test2'],
  });


  testAuth('invalid creds (scope subset)', {
    config: {credentials},
    requiredScopes: ['test-scope:test2'],
    clientScopes: ['test-scope:test1', 'test-scope:test2'],
  });

  testAuth('invalid creds', {
    config: {credentials: badcreds},
    requiredScopes: ['test-scope'],
    clientScopes: ['test-scope'],
    errorCode: 'AuthorizationFailed',
  });

  testAuth('insufficientScopes', {
    config: {credentials},
    requiredScopes: ['test-scope:*'],
    clientScopes: ['test-scope'],
    errorCode: 'InsufficientScopes',
  });

  testAuth('authorizedScopes', {
    config: {credentials, authorizedScopes: ['test-scope:test']},
    requiredScopes: ['test-scope:test'],
    clientScopes: ['test-scope:*'],
  });

  testAuth('authorizedScopes InsufficientScopes', {
    config: {credentials, authorizedScopes: ['test-scope:test1']},
    requiredScopes: ['test-scope:test2'],
    clientScopes: ['test-scope:*'],
    errorCode: 'InsufficientScopes',
  });

  testAuth('authorizedScopes over-scoped', {
    config: {credentials, authorizedScopes: ['test-scope:*']},
    requiredScopes: ['test-scope:test2'],
    clientScopes: ['test-scope:test2'],
    errorCode: 'AuthorizationFailed',
  });

  testAuth('authorizedScopes badcreds', {
    config: {credentials: badcreds, authorizedScopes: ['test-scope:test']},
    requiredScopes: ['test-scope:test'],
    clientScopes: ['test-scope:*'],
    errorCode: 'AuthorizationFailed',
  });

  // TODO: Add more test cases...
});
