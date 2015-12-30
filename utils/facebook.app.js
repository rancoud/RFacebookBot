global.getFacebookApp = function getFacebookApp(name, arrayEndpoints) {
  if(globalApp !== null) {
    name = globalApp;
  }

  if(name !== undefined) {
    for (var i = 0; i < confFacebookApp.length; i++) {
      if(confFacebookApp[i].name === name) {
        log.info('RFacebookBot', 'Use Facebook app %s', name);
        client = new RFacebook(confFacebookApp[i]);
        if(globalUser !== null) {
          client.setAccessTokenByUser(globalUser);
        }
        return client;
      }
    }
    log.error('RFacebookBot', 'Facebook app %s not found', name);
    throw "no app";
  }
  else {
    // no arguments? just give the first facebook app
    if(arrayEndpoints === undefined || !Array.isArray(arrayEndpoints) || arrayEndpoints.length < 1) {
      log.info('RFacebookBot', 'Use Facebook app %s', confFacebookApp[0].name);
      client = new RFacebook(confFacebookApp[0]);
      if(globalUser !== null) {
        client.setAccessTokenByUser(globalUser);
      }
      return client;
    }

    // for each facebook app we read rate limits using endpoints
    var matches = [];
    for (var i = 0; i < confFacebookApp.length; i++) {
      matches.push(0);
      var _rateLimit = getRateLimitByName(confFacebookApp[i].name, false);
      for (var j = 0; j < arrayEndpoints.length; j++) {
        var _parts = arrayEndpoints[j].split('/');
        var _endpoint = _rateLimit.resources[_parts[0]]['/'+arrayEndpoints[j]];
        if(_endpoint === undefined || _endpoint.remaining > 0) {
          matches[i]++;
        }
      }

      // if we have a full matches we can use this facebook app
      if(matches[i] === arrayEndpoints.length) {
        client = new RFacebook(confFacebookApp[i]);
        if(globalUser !== null) {
          client.setAccessTokenByUser(globalUser);
        }
        return client;
      }
    }

    log.error('RFacebookBot', 'No facebook app available');
    throw "no app";
  }
};
