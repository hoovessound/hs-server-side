# HoovesSound

### Thanks a lot <3

Howdy, I'm the creator of this project - Felix, 
and I'm so happy to see you here, 
because this project is still on `Alpha Beat` stage, 
and you have access to this repo witch mean you are one of a kind, 
and thanks for you help to make this silly project come a life.

# Getting started

### GCS Access

If you don't have an GCS(Google Cloud Platform) access, please contact Felix via Twitter, my handle is `@felixfong227`

Set your `keyfile.json` as an environment variables

`$GCS_AUTH='<keyfile.json JSON string>'`

### Database access

If you don't have an MongoDB(mLab hosted) access, please contact Felix via Twitter, my handle is `@felixfong227`

Set your DB url as an environment variables

`$DB='<MongoDB url>'`

# Maingun access
First you have to register your own Maingun account

And filling the `API Key` and the `API URL`

Set your `API Key` as an environment variables

`$MAILGUN_KEY='<your Mailgun API key>'`

`$MAILGUN_DOMAIN='<your Mailgun API domain>'`


### Port

The default port will be `3000`


# Change the run time config

You can also change the basic config settings via the Terminal

1. Port
  * `node src/base.js --port 3001`
  
# Native Dependencies
1. Imagemagick
    * Please making sure you have Imagemagick installed, because the application will process the `Track Cover` and the `Profile Picture` before uploading to GCS
