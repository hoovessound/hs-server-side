const express = require('express');
const router = express.Router();
const Users = require('../schema/Users');
const Tracks = require('../schema/Tracks');
const fullurl = require('fullurl');

router.get('/', (req, res) => {
    const token = req.body.token || req.headers.token || req.query.token;
    Users.findOne({
        token: token,
    })
    .then(user => {
        if(user === null){
            res.json({
                error: true,
                msg: 'Can not find your token',
                code: 'token_not_found',
            });
            return false;
        }else{
            // Find the user's tracks
            const offset = parseInt(req.query.offset) || 0;
            return Tracks.find({
                'author.username': user.username,
            }).limit(10).skip(offset).sort({uploadDate: -1}).then(tracks => {
                res.json(tracks);
            });
        }
    })
    .catch(error => {
        console.log(error);
    })
});

module.exports = router;