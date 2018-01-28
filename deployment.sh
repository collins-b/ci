# !/bin/bash

set -e
export IMG_TAG=$(echo $CIRCLE_SHA1 | cut -c -7)

[ -z "$DOCKER_PROJECT_NAME" ] && echo "Docker github repository name must be set in env as DOCKER_PROJECT_NAME ";

APPLICATION_SRC=$HOME/$CIRCLE_PROJECT_REPONAME/
DOCKER_SOURCE=$HOME/docker-src

DEPLOYMENT_ENVIRONMENT="staging"

echo " Deploying to ${DEPLOYMENT_ENVIRONMENT}"


if [ -z "$USE_CIRCLECI_BETA" ]; then
  # install kubectl and gcloud
  echo " Installing and configuring google cloud"
  sudo /opt/google-cloud-sdk/bin/gcloud --quiet version
  sudo /opt/google-cloud-sdk/bin/gcloud --quiet components update --version 183.0.0
  sudo /opt/google-cloud-sdk/bin/gcloud --quiet components update --version 183.0.0 kubectl
fi

# set key and authenticate gcloud
echo $ACCOUNT_ID_KEY | base64 --decode > ${HOME}/gcloud-service-key.json
sudo /opt/google-cloud-sdk/bin/gcloud auth activate-service-account --key-file ${HOME}/gcloud-service-key.json
export GOOGLE_APPLICATION_CREDENTIALS=${HOME}/gcloud-service-key.json
# sudo /opt/google-cloud-sdk/bin/gcloud beta auth application-default activate-service-account --key-file ${HOME}/gcloud-service-key.json

# configure gcloud
sudo /opt/google-cloud-sdk/bin/gcloud --quiet config set project $PROJECT_NAME
sudo /opt/google-cloud-sdk/bin/gcloud --quiet config set container/cluster $CLUSTER_NAME
sudo /opt/google-cloud-sdk/bin/gcloud --quiet config set compute/zone ${CLOUDSDK_COMPUTE_ZONE}
sudo /opt/google-cloud-sdk/bin/gcloud --quiet container clusters get-credentials $CLUSTER_NAME

rm -rf ${DOCKER_SOURCE}
mkdir -p ${DOCKER_SOURCE}

# pull docker repo
echo " Pulling docker image source from git "
/usr/bin/git clone --depth=1 -b ${TAG:-master} git@github.com:collins-b/${DOCKER_PROJECT_NAME}.git ${DOCKER_SOURCE}
echo " Successfully pulled"

mkdir ${DOCKER_SOURCE}/app/

echo " Injecting values from machine env"
DOCKER_FILE_CONTENT=`perl -p -e 's/\%([^%]+)\%/defined $ENV{$1} ? $ENV{$1} : "\${$1}"/eg' ${DOCKER_SOURCE}/Dockerfile`
echo "$DOCKER_FILE_CONTENT" > ${DOCKER_SOURCE}/Dockerfile
echo " Successfully injected"

echo " Building image"
if ! [ -z "$CIRCLE_TAG" ]; then
  IMG_TAG="$CIRCLE_TAG"
fi

if [ -z "$USE_CIRCLECI_BETA" ]; then
  echo " Building image"
  sudo /opt/google-cloud-sdk/bin/gcloud docker -- build -t gcr.io/${PROJECT_NAME}/${IMAGE}:$IMG_TAG  ${DOCKER_SOURCE} > /dev/null
  sudo docker tag -f gcr.io/${PROJECT_NAME}/${IMAGE}:${IMG_TAG} gcr.io/${PROJECT_NAME}/${IMAGE}:latest
  echo " Successfully built"

  echo " Pushing image"
  sudo /opt/google-cloud-sdk/bin/gcloud docker push gcr.io/${PROJECT_NAME}/${IMAGE}:$IMG_TAG
  sudo /opt/google-cloud-sdk/bin/gcloud docker push gcr.io/${PROJECT_NAME}/${IMAGE}:latest
  echo " Successfully pushed"
  sudo chown -R ubuntu:ubuntu /home/ubuntu/.kube
else
  echo " Building image"
  gcloud docker -- build -t gcr.io/${PROJECT_NAME}/${IMAGE}:$IMG_TAG  ${DOCKER_SOURCE} > /dev/null
  gcloud docker -- tag gcr.io/${PROJECT_NAME}/${IMAGE}:${IMG_TAG} gcr.io/${PROJECT_NAME}/${IMAGE}:latest
  echo " Successfully built"

  echo " Pushing image"
  gcloud docker -- push gcr.io/${PROJECT_NAME}/${IMAGE}:$IMG_TAG
  gcloud docker -- push gcr.io/${PROJECT_NAME}/${IMAGE}:latest
  echo " Successfully pushed"
fi

# TODO: push to general access repo too

echo " Deploying to ${DEPLOYMENT_ENVIRONMENT}"
/opt/google-cloud-sdk/bin/kubectl config current-context
/opt/google-cloud-sdk/bin/kubectl set image deployment/${DEPLOYMENT} ${CONTAINER_NAME}=gcr.io/${PROJECT_NAME}/${IMAGE}:$IMG_TAG
echo " Successfully deployed to ${DEPLOYMENT_ENVIRONMENT} :)"
