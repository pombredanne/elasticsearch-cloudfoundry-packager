var download  = require('./download-helper');
var fs = require('fs');
var editFile  = require('../lib/edit-config-file').editFile;

var url = 'http://dl.bintray.com/content/hmalphettes/elasticsearch-custom-headers/com/asquera/elasticsearch/http-basic/0.90.0.httpheaders/http-basic-0.90.0.httpheaders.jar?direct';

function params() {
  return '################################### HTTP Basic Authentication #################\n' +
         '\n' +
         'http.basic.enabled: true\n' + 
         'http.basic.user: "${ES_BASIC_AUTH_USER}"\n' +
         'http.basic.password: "${ES_BASIC_AUTH_PASSWORD}"\n' +
         '\n' +
         '################################### Gateway ###################################';
}

function install(folder, done) {
  if (!fs.existsSync(folder + '/plugins')) {
    fs.mkdirSync(folder + '/plugins');
  }
  if (fs.existsSync(folder + '/plugins/http-basic')) {
    return done();
  }
  download(url, folder + '/plugins/http-basic', false, function(err, topFolder) {
    var replacements = {
      '## Gateway ###': params()
    };
    editFile(folder + '/config/elasticsearch.yml', replacements, function(err) {
      done(err, url);
    });
  });
}

module.exports = install;
