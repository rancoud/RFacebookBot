var client = getFacebookApp();

client.api('oauth/access_token', {
    client_id: client.conf.appId,
    client_secret: client.conf.appSecret,
    grant_type: 'client_credentials'
}, function (res) {
    if(!res || res.error) {
        logFacebookError(res.error);
        return;
    }

    client.setAccessToken(res.access_token);

    client.api('4', function (res) {
      if(!res || res.error) {
       logFacebookError(res.error);
       return;
      }

      console.log(require('util').inspect(res, { depth: null }));
    });
});
