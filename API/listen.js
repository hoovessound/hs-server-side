const express = require('express');
const router = express.Router();
const Tracks = require('../schema/Tracks');
const path = require('path');
const fs = require('fs');
const https = require('https');
const request = require('request');

router.get('/:id?', (req, res) => {
    const id = req.params.id;
    console.log(id)
    Tracks.findOne({
        _id: id,
    }).then(track => {
        // Check if the file is extened or not
        if(track.file.extend){
            // Get the sound track from GCS
            // res.redirect(track.file.location);
            res.set({
                'Transfer-Encoding': 'chunked',
            });
            request(track.file.location).pipe(res);
        }else{
            // Send back the autio file
            const trackPath = path.join(`${__dirname}/../tracks/${track.file.location}`);
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