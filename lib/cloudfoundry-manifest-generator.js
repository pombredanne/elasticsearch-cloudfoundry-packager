var yaml = require('js-yaml')
  , fs = require('fs')
  , path = require('path');


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
function generateTemplate(options, done) {
  options.env = { ES_BASIC_AUTH_USER: options.user
              , ES_BASIC_AUTH_PASSWORD: options.password };
  options.url = (options.subdomain || options.appname) + '.${target-base}';
  console.log(options.appname);
  generateCloudfoundryTemplate(options.appname, options.url, options.subdomainName
  , options.folderPath || '.', options.memory, options.env, done);
}

function generateCloudfoundryTemplate(appname, url, subdomainName, folderPath, memory, env, done) {
  if (!url && !subdomainName) {
    subdomainName = appname;
  }
  if (!url) {
    url = subdomainName + '.${target-base}';
  }
  var manifest = { applications:
    [
      {
        name: appname
        , framework: 'standalone'
        , runtime: 'java'
        , memory: memory
        , instances: 1
        , url: url
        , path: folderPath
        , command: 'bin/elasticsearch -f'
        , env: env || {}
      }
    ]
  };
  done(null, yaml.dump(manifest));
}

module.exports = generateTemplate;
