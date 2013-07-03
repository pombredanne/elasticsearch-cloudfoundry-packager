#
# DOWNLOAD AND SEED YOUR ELASTICSEARCH STORE
#
if [ ! -d data/$ES_CLUSTER_NAME ] && [ $ES_SEED_ARCHIVE_URL ]; then
    ARCHIVE_NAME="seed-data.tgz"
    echo "About to reseed all elasticsearch tenants"
    wget $ES_SEED_ARCHIVE_URL -O $ES_HOME/$ARCHIVE_NAME
    if [ -d "$ES_HOME/orig-data" ]; then
        rm -rf $ES_HOME/orig-data
    fi

    if [ -d "$ES_HOME/data" ]; then
        mv $ES_HOME/data $ES_HOME/orig-data
    fi
    echo "Extracting $ES_SEED_ARCHIVE_URL in the data directory"
    tar xvf $ES_HOME/$ARCHIVE_NAME -C $ES_HOME
    echo "Renaming cluster to $ES_CLUSTER_NAME"
    if [ ! -d data/$ES_CLUSTER_NAME ]; then
        mv $ES_HOME/data/elasticsearch $ES_HOME/data/$ES_CLUSTER_NAME
    fi
    echo "$ES_SEED_ARCHIVE_URL has been extracted. "
    rm $ES_HOME/$ARCHIVE_NAME
fi
