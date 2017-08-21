import express from 'express';
const router = express.Router();
import Tracks from '../schema/Tracks';
import path from 'path';
import fs from 'fs';
import https from 'https';
import request from 'request';

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

                const track = await Tracks.findOne({_id: id});
                // Check if the file is extened or not
                if(track.file.extend){
                    // Get the sound track from GCS
                    res.set('Cache-Control', 'public, max-age=31557600');
                    res.set('Transfer-Encoding', 'chunked');
                    request(track.file.location).pipe(res);
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