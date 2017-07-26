const express = require('express');
const router = express.Router();
const Tracks = require('../schema/Tracks');
const path = require('path');
const fs = require('fs');
const request = require('request');
const https = require('https');

router.get('/:id?', (req, res) => {
    const id = req.params.id;
    const token = req.body.token || req.headers.token || req.query.token;
    Tracks.findOne({
        _id: id,
    }).then(track => {
        // Send back the autio file
        const trackPath = path.join(`${__dirname}/../tracks/${track.file.location}`);
        // Check if the file is extened or not
        if(track.file.extend){
            // Get the sound track from GCS

            if(token){
                request(track.file.location).pipe(res);
            }else{
                // Send the stream version
                https.get(track.file.location, (response) => {
                    response.on('data', function (body) {
                        res.write(new Buffer(body));
                    });
                });
            }

        }else{
            res.sendFile(trackPath);
        }
        
    })
    .catch(error => {
        if(error.message.includes('Cast to ObjectId failed for value')){
            res.setHeader('Content-Type', 'audio/mp3');
            res.end(null);
        }else{
            console.log(error)
        }
    });
});

module.exports = router;