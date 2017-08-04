#!/usr/bin/env bash

## Install the Google Cloud SDK first
#bash <( curl https://sdk.cloud.google.com) --disable-prompts
#
## Output the gcloud version
#/home/travis/google-cloud-sdk/bin/gcloud --version
#
## Aauthenticate the development bot
#/home/travis/google-cloud-sdk/bin/gcloud auth activate-service-account $EMAIL --key-file gcsAuth/gcsAuthToken.json
#
## Settings up the gcloud command
#/home/travis/google-cloud-sdk/bin/gcloud config set project $PROJECT_ID
#
## Deploy the bot
#/home/travis/google-cloud-sdk/bin/gcloud app deploy --quiet

# Deploy to the Clever Cloud

# Add the clever Git source
git add clever ssh://git@push-mtl-clevercloud-customers.services.clever-cloud.com/app_1dd0484e-1973-459b-b38b-4b4af9c930a3.git

git push clever master