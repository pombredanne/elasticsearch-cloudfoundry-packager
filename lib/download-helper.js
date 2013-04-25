var request = require('request')
	, fs = require('fs')
  , targz = require('tar.gz')
  , debug = require('debug')('download')
  , path = require('path')
  , parseUrl = require('url').parse;

function download(url, folder, forceDownload, done) {
  if (!folder) {
    folder = 'downloads';
  }
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }
  var file;
  var untargz = function(_file, _folder, cb) {
    var filenameMatch = _file.match(/^(.*)\.tar\.gz$/);
    if (!filenameMatch) {
      return done();
    }
    debug("Extracting " + _file + " into " + _folder);
    var compress = new targz().extract(_file, _folder, function(err){
      //check that we get the expected folder.
      var topFolder = filenameMatch[1];
      if (!err && !fs.existsSync(topFolder)) {
        err = new Error('Can\'t find the expected top level folder ' + topFolder);
      }
      cb(err, topFolder);
    });
  };

  if (url.indexOf('://') === -1) {
    //in the file system already?
    fs.exists(url, function(result) {
      if (!result) {
        done(new Error("The file " + url + " must exist"));
      } else {
        file = url;
      }
      untargz(file, folder, done);
    });
  } else {
    var filename = path.basename(parseUrl(url).pathname);
    file = folder + '/' + filename;
    if (!forceDownload && fs.existsSync(file)) {
      return untargz(file, folder, done);
    } 
    var fstream = fs.createWriteStream(file + ".ongoing");
    var doneCalledAlready = false;
    debug('Downloading ' + url + " into " + folder);
    var req = request(url).pipe(fstream);
    fstream.on("error", function(err) {
      if (!doneCalledAlready) {
        doneCalledAlready = true;
        done(err);
      }
    });
    fstream.on("close", function(err) {
      debug("Done downloading " + url + " into " + folder);
      if (!doneCalledAlready) {
        doneCalledAlready = true;
        fs.rename(file + ".ongoing", file, function(err0) {
          untargz(file, folder, done);
        });
      }
    });
  }
}

module.exports = download;