var Facebook = require('fb');

Facebook.prototype.getAppName = function () {
  return this.options.name;
};

global.RFacebook = Facebook;
