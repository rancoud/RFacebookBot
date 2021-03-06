function RFacebook(confFacebookApp) {
  this.fb = require('fb');
  this.conf = confFacebookApp;
  this.fb.options({
    appId: confFacebookApp.app_id,
    appSecret: confFacebookApp.app_secret,
    redirectUri: confFacebookApp.callback_url,
    version: "v2.5"
  });
}

RFacebook.prototype.getAppName = function () {
  return this.conf.name;
};

RFacebook.prototype.api = function (url, options, callback) {
  this.fb.api(url, options, callback);
};

RFacebook.prototype.setAccessToken = function (accessToken) {
  this.fb.setAccessToken(accessToken);
};

RFacebook.prototype.getApplicationAccessToken = function (callback) {
  this.fb.api('oauth/access_token', {
    client_id: this.conf.app_id,
    client_secret: this.conf.app_secret,
    grant_type: 'client_credentials'
  }, function (res) {
      if(!res || res.error) {
        logFacebookError(res.error);
        callback(false);
        return;
      }

      callback(res.access_token);
  });
};

RFacebook.prototype.setApplicationAccessToken = function (applicationAccessToken) {
  this.fb.setAccessToken(applicationAccessToken);
};

RFacebook.prototype.useApplicationAccessToken = function (callback) {
  this.fb.api('oauth/access_token', {
    client_id: this.conf.app_id,
    client_secret: this.conf.app_secret,
    grant_type: 'client_credentials'
  }, function (res) {
    if(!res || res.error) {
      logFacebookError(res.error);
      callback(false);
      return;
    }

    this.setApplicationAccessToken(res.access_token);

    callback(true);
  });
};

RFacebook.prototype.getLoginUrl = function (params) {
  return this.fb.getLoginUrl(params);
};

RFacebook.prototype.exchangeCodeForAccessToken = function (code, callback) {
  this.fb.api('oauth/access_token', {
    client_id: this.conf.app_id,
    client_secret: this.conf.app_secret,
    redirect_uri: this.conf.callback_url,
    code: code
  }, function (res) {
    if(!res || res.error) {
      logFacebookError(res.error);
      callback(false);
      return;
    }

    var accessToken = res.access_token;
    var expires = res.expires ? res.expires : 0;
    callback({access_token: res.access_token, expires: expires});
  });
};

RFacebook.prototype.extendAccessToken = function (accessToken) {
  this.fb.api('oauth/access_token', {
    client_id: this.conf.app_id,
    client_secret: this.conf.app_secret,
    grant_type: 'fb_exchange_token',
    fb_exchange_token: accessToken
  }, function (res) {
    if(!res || res.error) {
      logFacebookError(res.error);
      callback(false);
      return;
    }

    var accessToken = res.access_token;
    var expires = res.expires ? res.expires : 0;
    callback({access_token: res.access_token, expires: expires});
  });
};

RFacebook.prototype.setAccessTokenByUser = function (user) {
  try {
    var tokenJson = JSON.parse(fs.readFileSync(__dirname + '/../oauth_access_cache/' + user + '.tok'));
    for (var i = 0; i < tokenJson.length; i++) {
      if(tokenJson[i].app_name === this.getAppName()) {
        this.fb.setAccessToken(tokenJson[i].access_token);
        return;
      }
    }
  } catch (e) {
    log.error('RFacebookBot', 'Access token not found for user %s', user);
    process.exit(1);
  }

  log.error('RFacebookBot', 'Access token user %s not usable with app %s', screenName, this.getAppName());
  process.exit(1);
};

global.RFacebook = RFacebook;
