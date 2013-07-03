#
# DOWNLOAD AND SEED YOUR ELASTICSEARCH STORE
#
if [ "x$ES_RESEED_DATA" != "x" ] && [ $ES_RESEED_DATA = "YES" ]; then
    echo "About to reseed all elasticsearch tenants"
    if [ "x$ES_SEED_FILE" != "x" ]; then
        wget http://es-seed-data.s3.amazonaws.com/$ES_SEED_FILE
	    rm -rf orig-data
	    mv data orig-data || exit
        echo "Extracting $ES_SEED_FILE in the data directory"
        tar xvf $ES_SEED_FILE
        echo "$ES_SEED_FILE has been extracted. "
        rm $ES_SEED_FILE
    else
        echo "You need to specify the ES_SEED_FILE env variable to point to the seed file, which must reside in the s3://es-seed-data bucket"
    fi
fi
