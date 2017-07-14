# HoovesSound

### Thanks a lot <3

Howdy, I'm the creator of this project - Felix, 
and I'm so happy to see you here, 
because this project is still on `Alpha Beat` stage, 
and you have access to this repo witch mean you are one of a kind, 
and thanks for you help to make this silly project come a life.

# Getting started

### GCS Access

If you don't have an GCS(Google Cloud Platform) access, please contact Felix via email `moongod101@hotmail.com`

Once you have GCS access, the first thing you need to do is create a directory named `gcsAuth`, and inside the `gcsAuth` directory create a new JSON file named `token.json`, and that JSON file should your GCS access token info.

### Database access

If you don't have an MongoDB(mLab hosted) access, please contact Felix via email `moongod101@hotmail.com`

Once you have DB access, the first thing you need to do is create a `db.js`, and inside `db.js` exports MongoDB URL

```javascript
module.exports = {
    url: 'mongodb://<username>:<password>@<db url>'
}
````

### Port

The default port will be `3000`


# Change the run time config

You can also change the basic config settings via the Terminal

1. Port
  * `node src/index.js --port 3001`

2. db.js
  * `node src/index.js --db ./moduleName`