global.logFacebookError = function logFacebookError(error) {
  log.error('RFacebookBot', 'code: %d | message: "%s"', error[0].code, error[0].message);
};
