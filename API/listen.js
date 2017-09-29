const express = require('express');
const router = express.Router();
const Tracks = require('../schema/Tracks');
const path = require('path');
const fs = require('fs');
const https = require('https');
const request = require('request');
const { URL } = require('url');
const gcs = require('@google-cloud/storage')({
    projectId: 'hoovessound',
    keyFilename: require('../src/index').gcsPath,
});

router.get('/:id?', (req, res) => {
    const id = req.params.id;
    if(typeof id === 'undefined'){
        res.json({
            error: true,
            msg: 'Missing the id field',
            code: 'missing_require_fields',
        });
        return false;
    }

    class Listen {
        async findTrack(){
            try{

                const track = await Tracks.findOne({id});
                // Check if the file is extened or not
                if(track.file.extend){
                    const myUrl = new URL(track.file.location);
                    const baseName = path.basename(myUrl.pathname)
                    const extName = path.extname(baseName);
                    if(extName.endsWith('.ogg') || extName.endsWith('mp3')){
                        // Go stream the audio to the user

                        switch (extName){
                            case '.ogg':
                                res.setHeader('Content-Type', 'audio/ogg');
                                break;
                            case '.mp3':
                                res.setHeader('Content-Type', 'audio/mp3');
                                break;
                        }
                        res.set('Cache-Control', 'public, max-age=31557600');
                        // Stream the audio from GCS
                        gcs.bucket('hs-track')
                        .file(baseName)
                        .createReadStream()
                        .pipe(res)

                    }else{
                        res.end(`${extName} is not an valid audio file type`);
                    }
                }else{
                    // Send back the audio file
                    const trackPath = path.join(`${__dirname}/../tracks/${track.file.location}`);
                    res.sendFile(trackPath);
                }
            }
            catch(error){
                if(error.message.includes('Cast to ObjectId failed for value')){
                    res.setHeader('Content-Type', 'audio/mp3');
                    res.end(null);
                }else{
                    console.log(error);
                }
            }
        }
    }
    const listen = new Listen();
    listen.findTrack();

});

module.exports = router;