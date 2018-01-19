const express = require('express');
const router = express.Router();
const Tracks = require('../../schema/Tracks');
const path = require('path');
const request = require('request');
const sendSeekable = require('send-seekable');
router.use(sendSeekable);

router.get('/:id?', (req, res) => {

    const id = req.params.id;
    if(typeof id === 'undefined'){
        res.json({
            error: 'Missing the id field',
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
                    request({
                        url: track.file.location,
                        encoding: null,
                    }, (error, response, body) => {
                        res.setHeader('Cache-Control', 'no-cache');
                        res.sendSeekable(body);
                    })
                }else{
                    // Send back the audio file
                    const trackPath = path.join(`${__dirname}/../tracks/${track.file.location}`);
                    res.setHeader('Cache-Control', 'no-cache');
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