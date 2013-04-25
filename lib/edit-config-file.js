var fs = require('fs');

function editFile(filePath, replacements, done) {
  fs.readFile(filePath, function(err, res) {
    if (err) {
      return done(err);
    }
    var lines = res.toString().split('\n');
    lines.forEach(function(line, index) {
      Object.keys(replacements).forEach(function(pat) {
        var replac = replacements[pat];
        if (line.indexOf(pat) !== -1) {
          lines[index] = replac;
          replacements[pat] = '';
        }
      });
    });
    Object.keys(replacements).forEach(function(pat) {
      var replac = replacements[pat];
      if (replac !== '') {
        console.error('Did not find ' + pat + ' in ' + filePath);
      }
    });
    fs.writeFile(filePath, lines.join('\n'), done);
  });
}

module.exports = editFile;