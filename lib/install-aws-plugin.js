var download  = require('./download-helper');
var fs = require('fs');
var editFile  = require('../lib/edit-config-file');
var installPlugin = require('./install-plugin').installPlugin;

/*

cloud.aws.region: us-east-1
cloud.aws.access_key: AKIAJWDLLEMRK6Y7G4ZA
cloud.aws.secret_key: 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
#discovery.type: ec2
#discovery.ec2.host_type: public_ip
#discovery.ec2.groups: elasticsearch
gateway.type: s3
gateway.s3.bucket: es-indexes-stoic-es-central


*/
function params() {
  return 'cloud.aws.region: ${AWS_REGION}\n' +
         'cloud.aws.access_key: "${AWS_ACCESS_KEY}"\n' +
         'cloud.aws.secret_key: "${AWS_SECRET_KEY}"\n' +
         '#discovery.type: ec2\n' +
         '#discovery.ec2.host_type: public_ip\n' +
         '#discovery.ec2.groups: elasticsearch\n' +
         'gateway.type: ${GATEWAY_TYPE}\n' +
         'gateway.s3.bucket: ${AWS_S3_BUCKET}\n'+
         'gateway.fs.location: ${GATEWAY_FS_LOCATION}\n' +
         '\n' +
         '############################# Recovery Throttling #############################';
}

function install(folder, done) {
  installPlugin(folder, 'elasticsearch/elasticsearch-cloud-aws/1.12.0', function(err, topFolder) {
    var replacements = {
      '## Recovery Throttling ###': params()
    };
    editFile(folder + '/config/elasticsearch.yml', replacements, function(err) {
      done(err);
    });
  });
}

module.exports = install;
