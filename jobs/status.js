var client = getFacebookApp();
client.api('/' + options[0], function (res) {
  if(!res || res.error) {
    logFacebookError(res.error);
    return;
  }

  console.log(require('util').inspect(res, { depth: null }));
});
