// require all files in utils folder
colors = require('colors');
util = require('util');
fs = require('fs');
fs.readdirSync(__dirname + '/utils/').forEach(function(file) {
  if (file.match(/\.js$/) !== null && file !== 'index.js') {
    var name = file.replace('.js', '');
    require('./utils/' + file);
  }
});

// init variables
globalUser = globalApp = globalFile = null;
job = '';
options = [];
botDirname = __dirname;

// init logger
log = require('npmlog');
log.info('RFacebookBot', 'Init');
process.on('exit', function() {
  log.info('RFacebookBot', 'End');
  // remove process pid
  try {
    fs.unlinkSync(__dirname + '/pids/' + process.pid + '.pid');
  } catch (e) {
    //
  }
});

// get job + options
process.argv.forEach(function (val, index, array) {
  if(index == 2) {
    job = val;
  }

  if(index > 2) {
    options.push(val);
  }
});

// get general options
var _tmpOptions = [];
for (var i = 0, max = options.length; i < max; i++) {
  if(options[i] === '-u' || options[i] === '--user') {
    i++;
    if(i < max) {
      globalUser = options[i].toLowerCase();
    }
    else {
      log.error('RFacebookBot', 'user argument missing!');
      return;
    }
  }
  else if(options[i] === '-a' || options[i] === '--app') {
    i++;
    if(i < max) {
      globalApp = options[i];
    }
    else {
      log.error('RFacebookBot', 'app argument missing!');
      return;
    }
  }
  else if(options[i] === '-f' || options[i] === '--file') {
    i++;
    if(i < max) {
      globalFile = options[i];
    }
    else {
      log.error('RFacebookBot', 'file argument missing!');
      return;
    }
  }
  else {
    _tmpOptions.push(options[i]);
  }
}
options = _tmpOptions;

// if no job kill process
if(job.length < 1) {
  log.error('RFacebookBot', 'No job found');
  process.exit(9);
}

// get facebook app configurations and Facebook module
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

  // populate rate_limit_cache folder if empty
  var _json = getRateLimitByName(confFacebookApp[i].name);
  if(_json === null) {
    log.info('RFacebookBot', 'Update rate_limit_cache json for %s', confFacebookApp[i].name);
    getClientRateLimit(new RFacebook(confFacebookApp[i]), function(name) {
      return function(json) {
        saveRateLimitByName(name, JSON.stringify(json));

        ready--;
        if(ready === 0) {
          doJob();
        }
      };
    } (confFacebookApp[i].name));
  }
  else {
    ready--;
    if(ready === 0) {
      doJob();
    }
  }
}

function doJob() {
  log.info('RFacebookBot', 'Search Job: %s', job);
  // search job in private folder jobs
  fs.readdir(__dirname + '/private_jobs', function(err, files) {
    var f, l = files.length, found = false;
    for (var i = 0; i < l; i++) {
      if (files[i] === job + '.js') {
        // save pid
        fs.writeFileSync(__dirname + '/pids/' + process.pid + '.pid', job + ' ' + options.join(' '), 'utf-8');
        log.info('RFacebookBot', 'Load job file: %s', files[i]);
        found = true;
        require(__dirname + '/private_jobs/' + files[i]);
        break;
      }
    }

    if(found === true) {
      return;
    }

    // search job in folder jobs
    fs.readdir(__dirname + '/jobs', function(err, files) {
      var f, l = files.length, found = false;
      for (var i = 0; i < l; i++) {
        if (files[i] === job + '.js') {
          // save pid
          fs.writeFileSync(__dirname + '/pids/' + process.pid + '.pid', job + ' ' + options.join(' '), 'utf-8');
          log.info('RFacebookBot', 'Load job file: %s', files[i]);
          found = true;
          require(__dirname + '/jobs/' + files[i]);
          break;
        }
      }

      if(found === true) {
        return;
      }

      try {
        fs.readFileSync(job, 'utf8');
      } catch (e) {
        log.error('RFacebookBot', 'Job %s not found', job);
        return;
      }

      fs.writeFileSync(__dirname + '/pids/' + process.pid + '.pid', job + ' ' + options.join(' '), 'utf-8');
      log.info('RFacebookBot', 'Load job file: %s', job);
      require(job);
    });

  });
};
