# !/bin/bash

set -e
# Save the string to a text file
echo "Deploying to ${DEPLOYMENT_ENVIRONMENT}"
- echo $ACCOUNT_KEY_STAGING > key.txt
        # Decode the Service Account
- base64 -i key.txt -d > ${HOME}/gcloud-service-key.json
        # Authenticate CircleCI with the service account file
- sudo /opt/google-cloud-sdk/bin/gcloud auth activate-service-account ${ACCOUNT_ID} --key-file ${HOME}/gcloud-service-key.json
        # Set the default project
- sudo /opt/google-cloud-sdk/bin/gcloud config set project $PROJECT_ID
        # Set the default container
- sudo /opt/google-cloud-sdk/bin/gcloud --quiet config set container/cluster $CLUSTER_NAME
        # Set the compute zone
- sudo /opt/google-cloud-sdk/bin/gcloud config set compute/zone $CLOUDSDK_COMPUTE_ZONE
        # Get the cluster credentials.
- sudo /opt/google-cloud-sdk/bin/gcloud --quiet container clusters get-credentials $CLUSTER_NAME
        # Start good old Docker
- sudo service docker start
        # Build a docker image and use the Github commit hash ($CIRCLE_SHA1) as the tag
- docker build -t gcr.io/${PROJECT_ID}/${REG_ID}/edms:$CIRCLE_SHA1 .
        # Push the Image to the GCP Container Registry
- sudo /opt/google-cloud-sdk/bin/gcloud docker -- push gcr.io/${PROJECT_ID}/${REG_ID}/edms:$CIRCLE_SHA1
        # Update the default image for the deployment
- sudo /opt/google-cloud-sdk/bin/kubectl set image deployment/${DEPLOYMENT_NAME} ${CONTAINER_NAME}=gcr.io/${PROJECT_ID}/${REG_ID}/edms:$CIRCLE_SHA1
echo " Successfully deployed to ${DEPLOYMENT_ENVIRONMENT}"
