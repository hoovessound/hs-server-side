const express = require('express');
const router = express.Router();
const Tracks = require('../schema/Tracks');
const path = require('path');
const gcs = require('@google-cloud/storage')({
    projectId: 'hoovessound',
    keyFilename: require('../src/index').gcsPath,
});
const request = require('request');

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

                if(!track){
                    res.json({
                        error: 'Can\'t find your audio track source',
                        code: 'unexpected_result',
                    });
                }

                if(track.file.extend){
                    // res.set('Cache-Control', 'public, max-no-cache');
                    res.set('Cache-Control', 'public, max-31557600');
                    res.set('Transfer-Encodin', 'chunked');
                    res.set('Content-Type', 'application/octet-stream');
                    // Stream the audio from GCS
                    // const stream = gcs.bucket('hs-track')
                    // .file(baseName)
                    // .createReadStream()
                    // console.log(stream)
                    // res.pipe(stream);
                    // https.get(track.file.location).pipe(res);
                    request.get(track.file.location).pipe(res);

                }else{
                    // Send back the audio file
                    const trackPath = path.join(`${__dirname}/../tracks/${track.file.location}`);
                    res.sendFile(trackPath);
                }
            }
            catch(error){
                console.log(error);
            }
        }
    }
    const listen = new Listen();
    listen.findTrack();

});

module.exports = router;