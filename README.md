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

- downloads elasticsearch-0.90.0.RC2
- changes config/elastic.yml to use the environment VMC_APP_PORT for the port on which to listen to http requests
- changes bin/elasticsearch and bin/plugin to set VMC_APP_PORT to 9200 by default
- installs the [paramedic] () plugin
- installs the [head] () plugin
- installs a patched elasticsearch that supports custom-http-headers
- installs a patched [http-basic] () authentication plugin that sends the header 'WWW-Authorize'

Cloudfoundry Deployment
=======================

    `node bin/generate-cloudfoundry-manifest --name myelasticsearch\
        --memory 512M --user admin --password admin_pw`

Generate a manifest.yml at the root of the packaged elasticsearch server.
The name of the application is 'myelasticsearch'
The memory allocated to it is 512M
The http basic auth login is 'admin:admin_pw'.

Requirements
============
nodejs: runs the script
java: installs the elasticsearch plugins

Tested on Unix OS.

License:
========
Public Domain.
