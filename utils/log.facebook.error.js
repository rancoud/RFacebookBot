global.logFacebookError = function logFacebookError(error) {
  log.error('RFacebookBot', 'code: %d | message: "%s"', error.code, error.message);
};
