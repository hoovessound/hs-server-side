const express = require('express');
const router = express.Router();
const Tracks = require('../../schema/Tracks');
const path = require('path');
const youtubeDl = require('../../src/helper/youtubeDlCLI');

router.get('/:id?', (req, res) => {

    const id = req.params.id;
    if(typeof id === 'undefined'){
        res.status(403);
        res.json({
            error: 'Missing the id field',
        });
        return false;
    }

    class Listen {
        async findTrack(){
            try{

                const track = await Tracks.findOne({id});
                // Check if the file is extened or not

                if(!track){
                    res.status(403);
                    res.json({
                        error: 'Can not find your audio track source',
                    });
                }
                res.set('X-HoovesSound-Streaming', 'True');
                if(track.file.extend){
                    if(track.source === 'youtube'){
                        // Youtube import

                        // Grab the latest source link
                        const dl = new youtubeDl.youtubeDlCLI(track.file.location);
                        res.set('X-Youtube-Import', 'True');
                        dl.getUrl()
                        .then(url => res.redirect(url));
                    }else{
                        res.redirect(track.file.location);
                    }
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