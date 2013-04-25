require('setimmediate');
var exec = require('child_process').exec
  , spawn = require('child_process').spawn;
var fs = require('fs');
var debug  = require('debug')('package-es');

var download  = require('../lib/download-helper');
var editFile  = require('../lib/edit-config-file');
var installPlugin  = require('../lib/install-plugin').installPlugin;

var installAuthenticationPlugin = require('../lib/install-authentication-plugin');

var esURL = 'https://download.elasticsearch.org/elasticsearch/elasticsearch/elasticsearch-0.90.0.RC2.tar.gz';

function installOtherPlugins(folder, done) {
  installPlugin(folder, 'mobz/elasticsearch-head', function(err) {
    if (err) {
      return done(err);
    }
    installPlugin(folder, 'karmi/elasticsearch-paramedic', done);
  });
}

function editConfigForCloudfoundry(folder, done) {
  var configReplacements = {
    'network.bind_host: ': 'network.bind_host: ${VCAP_APP_HOST}',
    'network.host: ': 'network.host: ${VCAP_APP_HOST}',
    'http.port: ': 'http.port: ${VCAP_APP_PORT}'
  };
  var ymlConf = folder + '/config/elasticsearch.yml';

  var defaultEnvVars = '[ -z "$VCAP_APP_PORT" ] && export VCAP_APP_PORT=9200\n' +
                       '[ -z "$VCAP_APP_HOST" ] && export VCAP_APP_HOST=localhost\n';
  var binReplacements = {
    '# Start up the service': defaultEnvVars + '# Start up the service'
  };
  var binPath = folder + '/bin/elasticsearch';

  var pluginReplacements = {
    '# determine elasticsearch home': defaultEnvVars + '# determine elasticsearch home'
  };
  var pluginPath = folder + '/bin/plugin';
  editFile(ymlConf, configReplacements, function(err) {
    if (err) {
      return done(err);
    }
    editFile(binPath, binReplacements, function(err) {
      if (err) {
        return done(err);
      }
      editFile(pluginPath, pluginReplacements, done);
    });
  });
}

download(esURL, 'downloads', false, function(err, topFolder) {
  if (err) {
    return console.log('There was an error ' + err.message, err.stack);
  }
  
  editConfigForCloudfoundry(topFolder, function(err) {
    if (err) {
      return console.log('There was an error ' + err.message, err.stack);
    }

    installAuthenticationPlugin(topFolder, function(err) {
      if (err) {
        return console.log('There was an error ' + err.message, err.stack);
      }

      installOtherPlugins(topFolder, function(err) {
        if (err) {
          return console.log('There was an error ' + err.message, err.stack);
        }

        console.log('done!');
      });

    });

  });

});

