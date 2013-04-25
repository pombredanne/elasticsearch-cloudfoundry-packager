var download  = require('./download-helper');
var fs = require('fs');
var editFile  = require('../lib/edit-config-file');

//var url = 'https://github.com/downloads/Asquera/elasticsearch-http-basic/elasticsearch-http-basic-1.0.3.jar';
var url = 'https://github.com/hmalphettes/elasticsearch-http-basic/raw/uploads/downloads/http-basic-0.90.0.RC2.jar';


function params() {
  return '################################### HTTP Basic Authentication #################\n' +
         '\n' +
         'http.basic.enabled: true\n' + 
         'http.basic.user: "admin"\n' +
         'http.basic.password: "admin"\n' +
         '\n' +
         '################################### Gateway ###################################';
}

function install(folder, done) {
  console.error('not installing the authentication plugin for now.');
  return done();
  // if (!fs.existsSync(folder + '/plugins')) {
  //   fs.mkdirSync(folder + '/plugins');
  // }
  // if (fs.existsSync(folder + '/plugins/http-basic')) {
  //   return done();
  // } 
  // download(url, folder + '/plugins/http-basic', false, function(err, topFolder) {
  //   var replacements = {
  //     '## Gateway ###': params()
  //   };
  //   editFile(folder + '/config/elasticsearch.yml', replacements, done);
  // });
}

module.exports = install;
