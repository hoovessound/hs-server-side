const express = require('express');
const router = express.Router();
const Users = require('../schema/Users');
const Tracks = require('../schema/Tracks');
const fullurl = require('fullurl');

router.get('/:method?/:username?', (req, res) => {
    const token = req.body.token || req.headers.token || req.query.token;
    const username = req.params.username;
    const method = req.params.method;

    if(typeof method === 'undefined'){
        res.json({
            error: true,
            msg: 'Missing the method fields',
            code: 'missing_require_fields',
        });
        return false;
    }

    Users.findOne({
        token: token,
    }).then(user => {
        if(user === null){
            res.json({
                error: true,
                msg: 'Can not find your token',
                code: 'token_not_found',
            });
            return false;
        }else{
            if(method === 'token'){
                return Users.findOne({
                    token: token,
                }, {password: 0, tracks: 0, token: 0})
                .then(user => {
                    res.json(user)
                })
            }else{
                return Users.findOne({
                    username: username,
                }, {password: 0, tracks: 0, token: 0})
                .then(user => {
                    return Tracks.find({
                        'author.username': username,
                    })
                    .then(tracks => {
                        res.json({
                            user,
                            tracks,
                        });
                    })
                })
            }
        }
    })
    .catch(error => {
        console.log(error);
    });
});

module.exports = router;