#!/usr/bin/env bash

# Install the Google Cloud SDK first
bash <( curl https://sdk.cloud.google.com) --disable-prompts

# Settings up the gcloud command for later use case
alias gcloud=/home/travis/google-cloud-sdk/bin/gcloud

# Output the gcloud version
gcloud --version

# Aauthenticate the development bot
gcloud auth activate-service-account $EMAIL --key-file gcsAuth/gcsAuthToken.json

# Deploy the bot
gcloud app deploy