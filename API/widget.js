const express = require('express');
const router = express.Router();
const Tracks = require('../schema/Tracks');
const xFrameOptions = require('x-frame-options')

router.get('/:id?', (req, res) => {
    const full_address = req.protocol + "://" + req.headers.host;
    const id = req.params.id;
    Tracks.findById(id).then(track => {
        router.use(xFrameOptions());
        res.render('widget', {
            track,
            full_address,
        });
    }).catch(error => {
        if(error.message.includes('Cast to ObjectId failed for value')){
            res.render('widget', {
                track: null,
                full_address,
            });
        }else{
            console.log(error)
        }
    })
});

module.exports = router;