var exec = require('child_process').exec
  , spawn = require('child_process').spawn;
var fs = require('fs')
  , path = require('path')
  , ncp = require('ncp').ncp;
var debug  = require('debug')('package-es');
var async = require('async');

var download  = require('../lib/download-helper');
var editFile  = require('../lib/edit-config-file').editFile;
var appendFile  = require('../lib/edit-config-file').appendFile;
var installPlugin  = require('../lib/install-plugin').installPlugin;

var installAuthenticationPlugin = require('../lib/install-authentication-plugin');
var installAWSPlugin = require('../lib/install-aws-plugin');

var esURL = 'http://dl.bintray.com/hmalphettes/elasticsearch-custom-headers/org/elasticsearch/elasticsearch/1.0.0.Beta1-20130820/elasticsearch-1.0.0.Beta1-20130820.tar.gz';

var buildManifest = {};

function installOtherPlugins(folder, done) {
  async.series([
    function(done) {
      installPlugin(folder, 'mobz/elasticsearch-head', done);
    },
    function(done) {
      installPlugin(folder, 'lukas-vlcek/bigdesk', done);
    },
    function(done) {
      installPlugin(folder, 'bin/plugin -install elasticsearch/elasticsearch-lang-javascript/1.3.0', done);
    },
    function(done) {
      installPlugin(folder, 'karmi/elasticsearch-paramedic', done);
    },
    function(done) {
   // installPlugin(folder, './bin/plugin -url http://dl.bintray.com/jprante/elasticsearch-plugins/org/xbib/elasticsearch/plugin/elasticsearch-knapsack/2.0.0/elasticsearch-knapsack-2.0.0.zip -install knapsack', done);
      installPlugin(folder, './bin/plugin -url http://dl.bintray.com/hmalphettes/elasticsearch-custom-headers/org/xbib/elasticsearch/plugin/elasticsearch-knapsack/2.0.0.s/elasticsearch-knapsack-2.0.0.s.zip -install knapsack', done);
    }
  ], function(err)  {
    done(err);
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
                                     'index.store.type: ${ES_INDEX_STORE_TYPE}\n' +
                                     '# when true uses less file handles but less performance. by default false.\n' +
                                     'index.compound_format: ${ES_COMPOUND_FORMAT}',
    '# cluster.name: ': 'cluster.name: ${ES_CLUSTER_NAME}',
    'index.number_of_shards: ': 'index.number_of_shards: ${ES_NUMBER_OF_SHARDS}',
    '# discovery.zen.ping.multicast.enabled: ': 'discovery.zen.ping.multicast.enabled: false',
    '# discovery.zen.ping.unicast.hosts:': 'discovery.zen.ping.unicast.hosts: []',
    '# bootstrap.mlockall: true': 'bootstrap.mlockall: ${BOOTSTRAP_MLOCKALL}'

  };
  var ymlConf = folder + '/config/elasticsearch.yml';

  var defaultEnvVars = '# Default env variables for cloudfoundry.com\n' +
                       '[ -z "$VCAP_APP_PORT" ] && export VCAP_APP_PORT=9200\n' +
                       '[ -z "$VCAP_APP_HOST" ] && export VCAP_APP_HOST=localhost\n' +
                       '[ -z "$ES_BASIC_AUTH_USER" ] && export ES_BASIC_AUTH_USER=admin\n' +
                       '[ -z "$ES_BASIC_AUTH_PASSWORD" ] && export ES_BASIC_AUTH_PASSWORD=admin_pw\n' +
                       '\n' +
                       '[ -z "$BOOTSTRAP_MLOCKALL" ] && export BOOTSTRAP_MLOCKALL=false\n' +

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
                       '[ -z "$GATEWAY_FS_LOCATION" ] && export GATEWAY_FS_LOCATION="work"\n' +

                       '[ -z "$ES_NETWORK_TCP_KEEP_ALIVE" ] && export ES_NETWORK_TCP_KEEP_ALIVE=false\n' +
                       '[ -z "$ES_CLUSTER_NAME" ] && export ES_CLUSTER_NAME=elasticsearch\n' +
                       '[ -z "$ES_NUMBER_OF_REPLICAS" ] && export ES_NUMBER_OF_REPLICAS=0\n' +
                       '[ -z "$ES_NUMBER_OF_SHARDS" ] && export ES_NUMBER_OF_SHARDS=2\n' +
                       '[ -z "$ES_COMPOUND_FORMAT" ] && export ES_COMPOUND_FORMAT=true\n';

  var binReplacements = {
    'SCRIPT="$0"': 'SCRIPT="$0"\n\n' + defaultEnvVars
  };
  var binPath = folder + '/bin/elasticsearch';

  var binIncReplacements = {
    'JAVA_OPTS="$JAVA_OPTS -Xss256k"': 'JAVA_OPTS="$JAVA_OPTS -Xss256k"\n' +
                                       '\n' +
                                       '#Passs the tmp dir on Cloudfoundry to the JVM\n' +
                                       '[ -n "$TMPDIR" ] && JAVA_OPTS="$JAVA_OPTS -Djava.io.tmpdir=$TMPDIR"',
    //JAVA_OPTS="$JAVA_OPTS -XX:+HeapDumpOnOutOfMemoryError"
    'HeapDumpOnOutOfMemoryError': '[ -n "$ES_DO_HEAP_DUMP_ON_OOM" ] && JAVA_OPTS="$JAVA_OPTS -XX:+HeapDumpOnOutOfMemoryError"'
  };
  var binIncPath = folder + '/bin/elasticsearch.in.sh';

  var pluginReplacements = {
    'SCRIPT="$0"': 'SCRIPT="$0"\n\n' + defaultEnvVars
  };
  var pluginPath = folder + '/bin/plugin';
  var seedTenantData = path.join(__dirname, '../etc/seed-tenant-data.sh');

  async.series([
    function(done) {
      editFile(ymlConf, configReplacements, done);
    },
    function(done) {
      editFile(binPath, binReplacements, done);
    },
    function(done) {
      editFile(binIncPath, binIncReplacements, done);
    },
    function(done) {
      appendFile(binIncPath, seedTenantData, done);
    },
    function(done) {
      editFile(pluginPath, pluginReplacements, done);
    }],
    function(err) {
      done(err);
    }
  );
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
