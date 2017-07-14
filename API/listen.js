const express = require('express');
const router = express.Router();
const Tracks = require('../schema/Tracks');
const path = require('path');

router.get('/:id?', (req, res) => {
    const id = req.params.id;
    Tracks.findOne({
        _id: id,
    }).then(track => {
        // Send back the autio file
        
        // Check if the file is extened or not
        if(track.file.extend){
            // Get the sound track from HMS
            res.redirect(track.file.location);
        }else{
            const trackPath = path.join(`${__dirname}/../tracks/${track.file.location}`);
            res.sendFile(trackPath);
        }
        
    })
    .catch(error => {
        console.log(error);
    });
});

module.exports = router;