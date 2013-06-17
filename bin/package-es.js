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
var installAWSPlugin = require('../lib/install-aws-plugin');

var esURL = 'http://dl.bintray.com/hmalphettes/elasticsearch-custom-headers/org/elasticsearch/elasticsearch/1.0.0.Beta1-20130616/elasticsearch-1.0.0.Beta1-20130616.tar.gz';

var buildManifest = {};

function installOtherPlugins(folder, done) {
  installPlugin(folder, 'mobz/elasticsearch-head', function(err) {
    if (err) {
      return done(err);
    }
    installPlugin(folder, 'lukas-vlcek/elasticsearch-bigdesk', function(err) {
      if (err) {
        return done(err);
      }
      installPlugin(folder, 'bin/plugin -install elasticsearch/elasticsearch-lang-javascript/1.3.0', function(err) {
        installPlugin(folder, 'karmi/elasticsearch-paramedic', done);
      });
    });
  });
}

function editConfigForCloudfoundry(folder, done) {
  var configReplacements = {
    //'network.bind_host: ': 'network.bind_host: ${VCAP_APP_HOST}',
    'network.publish_host: ': 'network.publish_host: ${VCAP_APP_HOST}\n' +
                              '# node does not do keep alive and on CF we have limited number of connections.\n' +
                              'network.tcp.keep_alive: ${ES_NETWORK_TCP_KEEP_ALIVE}',
    'http.port: ': 'http.port: ${VCAP_APP_PORT}',
    '# index.number_of_replicas: 1': 'index.number_of_replicas: ${ES_NUMBER_OF_REPLICAS}\n\n' +
                                     '# Controle the index storage type; use memory on cloudfoundry.com\n' +
                                     'index.store.type: ${ES_INDEX_STORE_TYPE}',
    '# cluster.name: ': 'cluster.name: ${ES_CLUSTER_NAME}',
    'index.number_of_shards: ': 'index.number_of_shards: ${ES_NUMBER_OF_SHARDS}'
  };
  var ymlConf = folder + '/config/elasticsearch.yml';

  var defaultEnvVars = '# Default env variables for cloudfoundry.com\n' +
                       '[ -z "$VCAP_APP_PORT" ] && export VCAP_APP_PORT=9200\n' +
                       '[ -z "$VCAP_APP_HOST" ] && export VCAP_APP_HOST=localhost\n' +
                       '[ -z "$ES_BASIC_AUTH_USER" ] && export ES_BASIC_AUTH_USER=admin\n' +
                       '[ -z "$ES_BASIC_AUTH_PASSWORD" ] && export ES_BASIC_AUTH_PASSWORD=admin_pw\n' +

                       'if [ -z "$VMC_APP_INSTANCE"]; then\n' +
                       '  [ -z "$ES_INDEX_STORE_TYPE" ] && export ES_INDEX_STORE_TYPE=niofs\n' +
                       '  [ -z "$ES_HEAP_SIZE" ] && export ES_HEAP_SIZE=384m\n' +
                       'else # old cloudfoundry.com\n' +
                       '  [ -z "$ES_INDEX_STORE_TYPE" ] && export ES_INDEX_STORE_TYPE=memory\n' +
                       '  [ -z "$ES_HEAP_SIZE" ] && export ES_HEAP_SIZE=1024m\n' +
                       'fi\n' +

                       '[ -z "$GATEWAY_TYPE" ] && export GATEWAY_TYPE=""\n' +
                       '[ -z "$AWS_REGION" ] && export AWS_REGION=us-east-1\n' +
                       '[ -z "$AWS_ACCESS_KEY" ] && export AWS_ACCESS_KEY=""\n' +
                       '[ -z "$AWS_SECRET_KEY" ] && export AWS_SECRET_KEY=""\n' +
                       '[ -z "$AWS_S3_BUCKET" ] && export AWS_S3_BUCKET=""\n' +

                       '[ -z "$ES_NETWORK_TCP_KEEP_ALIVE" ] && export ES_NETWORK_TCP_KEEP_ALIVE=false\n' +
                       '[ -z "$ES_CLUSTER_NAME" ] && export ES_CLUSTER_NAME=elasticsearch\n' +
                       '[ -z "$ES_NUMBER_OF_REPLICAS" ] && export ES_NUMBER_OF_REPLICAS=0\n' +
                       '[ -z "$ES_NUMBER_OF_SHARDS" ] && export ES_NUMBER_OF_SHARDS=1\n';

  var binReplacements = {
    'SCRIPT="$0"': 'SCRIPT="$0"\n\n' + defaultEnvVars
  };
  var binPath = folder + '/bin/elasticsearch';

  var pluginReplacements = {
    'SCRIPT="$0"': 'SCRIPT="$0"\n\n' + defaultEnvVars
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

        installAWSPlugin(topFolder, function(err) {
          if (err) {
            return console.log('There was an error ' + err.message, err.stack);
          }
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

  });

}

package();
