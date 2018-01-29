# !/bin/bash

set -e

echo "Deploying to ${DEPLOYMENT_ENVIRONMENT}"

echo $ACCOUNT_KEY_STAGING > service_key.txt

base64 -i service_key.txt -d > ${HOME}/gcloud-service-key.json

sudo /opt/google-cloud-sdk/bin/gcloud auth activate-service-account ${ACCOUNT_ID} --key-file ${HOME}/gcloud-service-key.json

sudo /opt/google-cloud-sdk/bin/gcloud config set project $PROJECT_ID

sudo /opt/google-cloud-sdk/bin/gcloud --quiet config set container/cluster $CLUSTER_NAME

sudo /opt/google-cloud-sdk/bin/gcloud config set compute/zone $CLOUDSDK_COMPUTE_ZONE

sudo /opt/google-cloud-sdk/bin/gcloud --quiet container clusters get-credentials $CLUSTER_NAME

sudo service docker start

docker build -t gcr.io/${PROJECT_ID}/${REG_ID}/edms:$CIRCLE_SHA1 .

sudo /opt/google-cloud-sdk/bin/gcloud docker -- push gcr.io/${PROJECT_ID}/${REG_ID}/edms:$CIRCLE_SHA1

sudo /opt/google-cloud-sdk/bin/kubectl set image deployment/${DEPLOYMENT_NAME} ${CONTAINER_NAME}=gcr.io/${PROJECT_ID}/${REG_ID}/edms:$CIRCLE_SHA1

echo " Successfully deployed to ${DEPLOYMENT_ENVIRONMENT}"
