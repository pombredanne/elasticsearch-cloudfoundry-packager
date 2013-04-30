require('setimmediate');
var exec = require('child_process').exec
  , spawn = require('child_process').spawn;
var fs = require('fs')
  , path = require('path')
  , ncp = require('ncp').ncp;
var debug  = require('debug')('package-es');

var download  = require('../lib/download-helper');
var editFile  = require('../lib/edit-config-file');
var installPlugin  = require('../lib/install-plugin').installPlugin;

var installAuthenticationPlugin = require('../lib/install-authentication-plugin');

var esURL = 'http://dl.bintray.com/content/hmalphettes/elasticsearch-custom-headers/org/elasticsearch/elasticsearch/0.90.0.httpheaders/elasticsearch-0.90.0.httpheaders.tar.gz';

var buildManifest = {};

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
    //'network.bind_host: ': 'network.bind_host: ${VCAP_APP_HOST}',
    'network.publish_host: ': 'network.publish_host: ${VCAP_APP_HOST}',
    'http.port: ': 'http.port: ${VCAP_APP_PORT}'
  };
  var ymlConf = folder + '/config/elasticsearch.yml';

  var defaultEnvVars = '[ -z "$VCAP_APP_PORT" ] && export VCAP_APP_PORT=9200\n' +
                       '[ -z "$VCAP_APP_HOST" ] && export VCAP_APP_HOST=localhost\n' +
                       '[ -z "$ES_BASIC_AUTH_USER" ] && export ES_BASIC_AUTH_USER=admin\n' +
                       '[ -z "$ES_BASIC_AUTH_PASSWORD" ] && export ES_BASIC_AUTH_PASSWORD=admin_pw\n';
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

function package() {
  download(esURL, 'downloads', false, function(err, topFolder) {
    if (err) {
      return console.log('There was an error ' + err.message, err.stack);
    }
    buildManifest.elasticsearch = path.basename(topFolder);
    buildManifest.url = esURL;
    
    editConfigForCloudfoundry(topFolder, function(err) {
      if (err) {
        return console.log('There was an error ' + err.message, err.stack);
      }

      installAuthenticationPlugin(topFolder, function(err, authenticationPluginURL) {
        if (err) {
          return console.log('There was an error ' + err.message, err.stack);
        }
        buildManifest['http-basic'] = {
          name: path.basename(authenticationPluginURL),
          url: authenticationPluginURL
        };

        installOtherPlugins(topFolder, function(err) {
          if (err) {
            return console.log('There was an error ' + err.message, err.stack);
          }
          fs.writeFileSync(topFolder + '/build.json', JSON.stringify(buildManifest, null, 2));
          ncp(topFolder, 'elasticsearch-latest', function (err) {
            console.log('done!');
          });
        });

      });

    });

  });

}

package();
