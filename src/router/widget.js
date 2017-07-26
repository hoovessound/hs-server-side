const express = require('express');
const router = express.Router();
const rp = require('request-promise');
const fullurl = require('fullurl');
const Tracks = require('../../schema/Tracks');

router.get('/:id?', (req, res) => {
    const full_address = req.protocol + "://" + req.headers.host;
    const id = req.params.id;
    Tracks.findById(id).then(track => {
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