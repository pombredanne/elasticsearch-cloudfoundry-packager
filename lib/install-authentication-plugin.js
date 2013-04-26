var download  = require('./download-helper');
var fs = require('fs');
var editFile  = require('../lib/edit-config-file');

var url =              'https://raw.github.com/hmalphettes/elasticsearch-http-basic/uploads/downloads/http-basic-0.90.0.RC3h.jar';
var elasticsearchJar = 'http://dl.bintray.com/content/hmalphettes/elasticsearch/elasticsearch-0.90.0.RC3h.jar?direct';
//'https://raw.github.com/hmalphettes/elasticsearch/uploads/downloads/elasticsearch-0.90.0.RC3h.jar';

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
      if (err) {
        return done(err);
      }
      patchElasticSearchWithHttpCustomHeaders(folder, done);
    });
  });
}

function patchElasticSearchWithHttpCustomHeaders(folder, done) {
  if (!fs.existsSync(folder + '/lib/elasticsearch-0.90.0.RC3h.jar')) {
    fs.readdir(folder + '/lib', function(err, files) {
      var fileToDelete;
      files.some(function(file) {
        if (file.match(/^elasticsearch\-.*\.jar$/)) {
          fileToDelete = file;
          return true;
        }
      });
      if (!fileToDelete) {
        console.error('Warn: did not find an elasticsearch jar to delete');
      }
      download(elasticsearchJar, folder + '/lib', false, function(err, topFolder) {
        if (err) {
          return done(err);
        }
        if (fileToDelete) {
          fs.unlink(folder + '/lib/' + fileToDelete, function(err) {
            done(err);
          });
        } else {
          done();
        }
      });
    });
    //delete the previous elasticsearch jar
  } else {
    done();
  }

}


module.exports = install;
