const express = require('express');
const router = express.Router();
const Tracks = require('../schema/Tracks');
const xFrameOptions = require('x-frame-options')

router.get('/:id?', (req, res) => {
    const full_address = req.protocol + "://" + req.headers.host;
    const id = req.params.id;
    Tracks.findOne(id).then(track => {
        router.use(xFrameOptions());
        if(!track){
            res.render('widget', {
                track: null,
                full_address,
            });
            return false;
        }
        res.render('widget', {
            track,
            full_address,
        });
    }).catch(error => {
        console.log(error);
    })
});

module.exports = router;