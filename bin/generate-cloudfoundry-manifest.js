var generateTemplate = require('../lib/cloudfoundry-manifest-generator')
  , fs = require('fs');

var options = {};

var program = require('commander');

program
  .version('0.0.1')
  .option('--appname [appname]', 'Application Name')
  .option('--memory [256M]', 'Memory allocated to the JVM')
  .option('--user [admin]', 'HTTP Basic Auth user')
  .option('--pass [admin_pw]', 'HTTP Basic Auth password')
  .option('--subdomain [subdomain]', 'URL subdomain')
  .option('--esfolder [esfolder]', 'path to ES folder')
  .parse(process.argv);

/*
---
applications:
- name: ESAPPNAME
  framework: standalone
  runtime: java
  memory: 256M
  instances: 1
  url: ${name}.${target-base}
  path: .
  command: bin/elasticsearch -f
  env:
    ES_BASIC_AUTH_USER: 'admin'
    ES_BASIC_AUTH_PASSWORD: 'admin_pw'
*/

var options = {
  appname: program.appname || 'elasticsearch'
  , memory: program.memory || '256M'
  , user: program.user || 'admin'
  , password: program.pass || 'admin_pw'
  , subdomain: program.subdomain || program.appname || 'elasticsearch'
};
console.log('def', options);
var destinationFile = (program.esfolder || 'downloads/elasticsearch-0.90.0.RC2') + '/manifest.yml';

generateTemplate(options, function(err, manifestStr) {
  fs.writeFile(destinationFile, manifestStr, function (err) {
    console.log('Done generating ' + destinationFile);
  });
});


