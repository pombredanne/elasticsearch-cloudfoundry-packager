var exec = require('child_process').exec
  , spawn = require('child_process').spawn
  , debug = require('debug')('install-plugin')
  , fs = require('fs');

/**
 * mobz/elasticsearch-head -> head plugin.
 */
function installPlugin(folder, url, done) {
  var pluginNameMatch = url.match(/\/elasticsearch\-(.*)$/);
  if (!pluginNameMatch) {
    return done(new Error('Unexpected type of url for a plugin ' + url +
      ' did not match /\\/elasticsearch\\-(.*)$/'));
  }
  if (fs.existsSync(folder + '/plugins/' + pluginNameMatch[1])) {
    console.log(url + ' is already installed');
    return done();
  }
  executeCmd(folder, './bin/plugin -install ' + url, done);
}

function executeCmd(folder, cmd, done) {
  console.log('cmd', cmd);
  var spawnOptions = process.env;
  var spawnArgs = [ '--verbose' ];
  var allDone = false;
  var execOptions = { cwd: folder, stdout: 'inherit', stderr: 'inherit', stdin: 'inherit' };
  var child = exec(cmd, execOptions, function(err, stdout, stderr) {
    console.log("Oh done?", err, stdout, stderr);
    allDone = true;
    debug("Done with vmc __cmd " + stdout, stderr);
    done(err, true, stdout, stderr);
  });
  child.stdout.on('data', function (data) {
    console.log('stdout: ' + data);
  });
  child.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
  });
  child.stderr.on('drain', function (data) {
    console.log('drained', data);
  });
  child.on('exit', function (code) {
    allDone = true;
    console.log('child process exited with code ' + code);
  });
}

exports.installPlugin = installPlugin;