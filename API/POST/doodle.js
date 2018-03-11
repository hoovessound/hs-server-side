const express = require('express');
const router = express.Router();
const Doodles = require('../../schema/Doodles');
const genId = require('../../src/helper/genId');
const htmlEscape = require('escape-html');
const formidable = require('formidable');
const fileType = require('file-type');
const escape = require('escape-html');
const sha256 = require('sha256');
const path = require('path');
const fsp = require('fs-promise');
const fs = require('fs');
const indexJs = require('../../src/index');

const gcs = require('@google-cloud/storage')({
    projectId: 'hoovessound',
    keyFilename: require('../../src/index').gcsPath,
});


class Doodle {
    constructor(req, res){
        this.res = res;
        this.req = req;
    }

    async addDoodle(fields, files){
        const res = this.res;
        const req = this.req;
        const image = files.image;
        const user = req.hsAuth.user;
        // Check the file type
        if(!fileType(fs.readFileSync(image.path)).mime.includes('image')){
            res.status(403);
            res.json({
                error: 'You much upload an image file',
            });
            return false;
        }
        const newFileId = genId(30);
        const ext = path.extname(image.name);
        await fsp.rename(image.path, path.join(`${__dirname}/../../usersContent/${newFileId}${ext}`));
        gcs.bucket('hs-doodle').upload(path.join(`${__dirname}/../../usersContent/${newFileId}${ext}`))
        .then(file => {
            file = file[0];
            return file.makePublic()
        })
        .then(() => {
            const url = `https://storage.googleapis.com/hs-doodle/${newFileId}${ext}`;
            const data = {
                id: genId(30),
                title: escape(fields.title),
                author: {
                    source: 'hoovessound',
                    name: user.fullName,
                    id: user.id,
                    link: fields.url
                },
                image: url,
            }
            return new Doodles(data).save()
            .then(() => {
                res.json(data);
            })
            .catch(error => {
                console.log(error);
            })
        })
        .catch(error => {
            console.log(error);
        })
    }
}

router.post('/', (req, res) => {
    const doodle = new Doodle(req, res);
    const form = formidable.IncomingForm({
        uploadDir: indexJs.tmp,
    });
    form.parse(req, (error, fields, files) => {
        if(!fields.title){
            res.status(403);
            res.json({
                error: 'Missing the "title" field',
            });
            return false;
        }
    
        if(!fields.url){
            res.status(403);
            res.json({
                error: 'Missing the "profile url" field',
            });
            return false;
        }
    
        if(!files.image){
            res.status(403);
            res.json({
                error: 'Missing the artwork image',
            });
            return false;
        }
        doodle.addDoodle(fields, files);
    })
});

module.exports = router;