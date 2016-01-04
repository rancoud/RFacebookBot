function RFacebook(confFacebookApp) {
  this.fb = require('fb');
  this.conf = confFacebookApp;
  this.fb.options(confFacebookApp);
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

global.RFacebook = RFacebook;
