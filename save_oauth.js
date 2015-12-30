// require all files in utils folder
colors = require('colors');
util = require('util');
fs = require('fs');
fs.readdirSync(__dirname + '/utils/').forEach(function(file) {
  if (file.match(/\.js$/) !== null && file !== 'index.js') {
    var name = file.replace('.js', '');
    require(__dirname + '/utils/' + file);
  }
});

// init variables
globalUser = globalApp = null;
options = [];
authData = {};

// init logger
log = require('npmlog');
log.info('RFacebookBot SaveOauth', 'Init');

// get options
process.argv.forEach(function (val, index, array) {
  if(index > 1) {
    options.push(val);
  }
});

// get general options
var _tmpOptions = [];
for (var i = 0, max = options.length; i < max; i++) {
  if(options[i] === '-a' || options[i] === '--app') {
    i++;
    if(i < max) {
      globalApp = options[i];
    }
    else {
      log.error('RFacebookBot', 'app argument missing!');
      return;
    }
  }
  else {
    _tmpOptions.push(options[i]);
  }
}
options = _tmpOptions;

// get facebook app configurations
confFacebookApp = require(__dirname + '/conf.facebook.app.js');

// check confFacebookApp > not empty AND no duplicate name
if(confFacebookApp.length === 0) {
  log.error('RFacebookBot', 'File conf.facebook.app.js is empty');
  process.exit(1);
}
var _names = [];
var ready = confFacebookApp.length;
for (var i = 0; i < confFacebookApp.length; i++) {
  if(_names.indexOf(confFacebookApp[i].name) !== -1) {
    log.error('RFacebookBot', 'Duplicate names in file conf.facebook.app.js');
    process.exit(1);
  }
  _names.push(confFacebookApp[i].name);
}

if(options[0] !== undefined) {
  client = getFacebookApp(options[0]);
}
else {
  client = getFacebookApp();
}

// setup server
http = require('http');
server = http.createServer(function (req, res) {
  if(req.url === '/') {
    client.getAuthUrl(function(oauthData){
      log.info('RFacebookBot SaveOauth', 'Generate authentification url %s', oauthData.url);
      authData = oauthData;
      res.writeHead(302, {'Location': oauthData.url});
      res.end();
      return;
    });
  }
  else {
    var query = require('url').parse(req.url, true).query;
    if(query.oauth_token === undefined || query.oauth_verifier === undefined) {
      return;
    }

    client.resetAccessToken();

    client.authenticate(query.oauth_token, authData.oauth_token_secret, query.oauth_verifier, function(accessToken) {
      if(accessToken !== false) {
        accessToken.app_name = client.getAppName();
        client.setAccessToken(accessToken.access_token_key, accessToken.access_token_secret);
        client.get('account/settings',  function(error, tweet, response) {
          if(error) {
            logFacebookError(error);
            throw error;
          }

          // write file in oauth_access_cache
          var fileToken = __dirname + '/oauth_access_cache/' + tweet.screen_name.toLowerCase() + '.tok';
          var accessTokenFileStats = null;
          var accessTokenJson = [];
          var found = false;

          try {
            accessTokenFileStats = fs.statSync(fileToken);
          } catch (e) {
            //
          }

          if(accessTokenFileStats !== null) {
            accessTokenFileJson = fs.readFileSync(fileToken, 'utf8');
            accessTokenJson = JSON.parse(accessTokenFileJson);
            for (var i = 0; i < accessTokenJson.length; i++) {
              if(accessTokenJson[i].app_name === accessToken.app_name) {
                found = true;
                log.info('RFacebookBot SaveOauth', 'Update access token for user %s for app %s', tweet.screen_name.toLowerCase(), accessToken.app_name);
                accessTokenJson[i] = accessToken;
                break;
              }
            }
          }

          if(accessTokenFileStats === null || !found) {
            log.info('RFacebookBot SaveOauth', 'Add access token user %s for app %s', tweet.screen_name.toLowerCase(), accessToken.app_name);
            accessTokenJson.push(accessToken);
          }

          fs.writeFileSync(fileToken, JSON.stringify(accessTokenJson));
        });

        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end("Access Token saved");

        return;
      }
      else {
        log.error('RFacebookBot SaveOauth', 'Error in callback authenticate');

        res.writeHead(500, {'Content-Type': 'text/plain'});
        res.end("Error when callback authenticate");

        return;
      }
    });
  }
});

// now that server is running
server.listen(3000, '127.0.0.1', function(){
  log.info('RFacebookBot SaveOauth', 'Server listening');
});
