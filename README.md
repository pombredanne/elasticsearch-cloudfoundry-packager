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

Obsolete: Cloudfoundry.com - Version-1 Constraints
========================================
## `index.storage.type: 'memory'`
Cloudfoundry.com does not provide an env with a lot of opened file descriptors.
This leaves us only the 'memory' type of storage for the indices.
TODO: More testing deserved for the 'ram' type.

## `network.tcp.keep_alive: false`
In our use case we connect via node.js and keep-alive is simply not there yet as of 0.10
Switching off keep-alive when running out of file opened descriptors got rid of the stack traces related to network connections.
TODO: Try with keep alive enabled again as we were working on too many fronts at the same time.

## Replicas and Shards
All in memory: so  we use a single shard and a no replica.

Cloudfoundry V2 constraints
===========================
Cloudfoundry V2 has a single constraint: no support for clustering.
This is because each app runs in a container where a single http port is opened.

We would need to develop a Discovery plugin for ES that can have its communication go through http on the same port than the queries.

Durability
==========

Setup the Shared Gateway S3 plugin.
The S3 Gateway will periodically send the indexes and cluster state into an S3 bucket.

Recipe: from S3 to a local instance and back
--------------------------------------------

At Stoic we are currently using Elasticsearch as our primary datastore.
It is either amazing or good enough for what we do for the rest.

In the area of good-enough; here is how we tackle durability:
- Download the content of the backup: `${bucket-name}/${elasticsearch-cluster-name}`. I use [3hubapp](http://3hubapp.com) for UI to do that as Cyberduck did not work for me.
- Copy this folder into elasticsearch/works/${elasticsearch-cluster-name}
- Start Elasticsearch with the same clustername and with the Shared Filesystem Gateway.

    `ES_CLUSTER_NAME=${elasticsearch-cluster-name} GATEWAY_TYPE=fs ./bin/elasticsearch -f`

Enjoy debugging on your local machine.

If you want to uploiad the data back to S3, simply copy paste the content of the `work/${elasticsearch-cluster-name}` back in the original `${bucket}/${elasticsearch-cluster-name}`.

When you want to switch back to the data you had before, restart Elasticsearch without defining the clustername and the gateway type.


Requirements
============
nodejs: runs the script
java: installs the elasticsearch plugins

Tested on Unix OS.

License:
========
Public Domain.
