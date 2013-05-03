ElasticSearch Packager for Cloudfoundry.
========================================

Script to download a build of Elasticsearch and edit its configuration files so that it runs on cloudfoundry.
Also installs a few useful plugins

Usage
=====

	npm install
    node bin/package-es
    node bin/generate-cloudfoundry-manifest --name myelasticsearch --memory 512M --user admin --password admin_pw

Plugins Installed
=================

    `node bin/package-es`

- downloads elasticsearch-0.90.0.httpheaders: [patched build with support for custom httpheaders] (https://github.com/hmalphettes/elasticsearch) on [bintray] (https://bintray.com/pkg/show/general/hmalphettes/elasticsearch-custom-headers/elasticsearch)
- changes config/elastic.yml to use the environment VMC_APP_PORT for the port on which to listen to http requests
- changes bin/elasticsearch and bin/plugin to set VMC_APP_PORT to 9200 by default
- heap size set by default to 192m
- index storage type controlled by the env variable ES_INDEX_STORAGE_TYPE and set to 'memory' by default
- ES_NETWORK_TCP_KEEP_ALIVE set to true by default and controlled by the environment variable
- installs the [paramedic] (https://github.com/karmi/elasticsearch-paramedic) plugin
- installs the [head] (https://github.com/mobz/elasticsearch-head) plugin
- installs the [bigdesk] (https://github.com/lukas-vlcek/bigdesk) plugin - hmalphettes's branch to tolerate snapshot builds of ES.
- installs a patched [http-basic] (https://github.com/hmalphettes/elasticsearch-http-basic) authentication plugin that sends the header 'WWW-Authorize' also deployed on [bintray] (https://bintray.com/pkg/show/general/hmalphettes/elasticsearch-custom-headers/elasticsearch)

Cloudfoundry Deployment
=======================

    `node bin/generate-cloudfoundry-manifest --name myelasticsearch\
        --memory 512M --user admin --password admin_pw`

Generate a manifest.yml at the root of the packaged elasticsearch server.
The name of the application is 'myelasticsearch'
The memory allocated to it is 512M
The http basic auth login is 'admin:admin_pw'.

Cloudfoundry.com Constraints
============================
## `index.storage.type: 'memory'`
Cloudfoundry.com does not provide an env with a lot of opened file descriptors.
This leaves us only the 'memory' type of storage for the indices.
TODO: More testing deserved for the 'ram' type.

## `network.tcp.keep_alive: false`
In our use case we connect via node.js and keep-alive is simply not there yet as of 0.10
Switching off keep-alive when running out of file opened descriptors got rid of the stack traces related to network connections.
TODO: Try with keep alive enabled again as we were working on too many fronts at the same time.

## Replicas and Shards
Given the in-memory storage and the lack of discoverability:
- No Replica.
- Single shard.

Requirements
============
nodejs: runs the script
java: installs the elasticsearch plugins

Tested on Unix OS.

License:
========
Public Domain.
