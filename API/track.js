const express = require('express');
const router = express.Router();
const Tracks = require('../schema/Tracks');
const Users = require('../schema/Users');
const mongoose = require('mongoose');
let status;
router.get('/:username?/:title?', (req, res) => {
    const full_address = req.protocol + "://" + req.headers.host;
    const token = req.body.token || req.headers.token || req.query.token;
    const username = req.params.username || req.headers.username;
    const title = req.params.title || req.headers.title;
    const ID = req.query.id;
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

            if(ID){
                return Tracks.findOne({
                    _id: ID,
                })
                .then(track => {
                    res.json(track);
                });
            }else{
                return Tracks.findOne({
                    'author.username': username,
                    title: title
                })
                .then(track => {
                    res.json(track);
                });
            }
        }
    })
    .catch(error => {
        console.log(error);
    })
});

router.post('/fave/:id?', (req, res) => {
    const id = req.params.id;
    const token = req.body.token || req.headers.token || req.query.token;
    let findFave = false;
    if (typeof id === 'undefined') {
        res.json({
            error: true,
            msg: 'Missing the id field',
            code: 'missing_require_fields',
        });
        return false;
    }
    Users.findOne({
        token,
    })
    .then(user => {
        if (user === null) {
            res.json({
                error: true,
                msg: 'Can not find your token',
                code: 'token_not_found',
            });
            return false;
        } else {
            this.user = user;
            return Tracks.findOne({
                _id: id,
            })
            .then(track => {
                if (track === null) {
                    res.json({
                        error: true,
                        msg: 'Can not found your track',
                        code: 'missing_result_object',
                    })
                    return false;
                }
                // If the user already fave the track, just remove it, if not add one
                user.fave.forEach(id => {
                    if (id == track._id.toString()) {
                        findFave = true;
                    }
                });

                if (findFave) {
                    // Remove it
                    user.fave.splice(user.fave.indexOf(track._id.toString()), 1);
                    status = 'removed';
                } else {
                    user.fave.push(track._id);
                    status = 'added';
                }
                return Users.update({
                    _id: this.user._id,
                }, user)
                .then(afterUpdate => {
                    res.json({
                        faves: user.fave,
                        status,
                    })
                })
            });
        }
    })
    .catch(error => {
        console.log(error);
    })
});

router.get('/fave/isfave/:id?', (req, res) => {
    const token = req.body.token || req.headers.token || req.query.token;
    const id = req.params.id;
    let findFave = false;
    if (typeof id === 'undefined') {
        res.json({
            error: true,
            msg: 'Missing the id field',
            code: 'missing_require_fields',
        });
        return false;
    }

    Users.findOne({
        token,
    })
    .then(user => {
        if (user === null) {
            res.json({
                error: true,
                msg: 'Can not find your token',
                code: 'token_not_found',
            });
            return false;
        } else {
            this.user = user;
            return Tracks.findOne({
                _id: id,
            })
            .then(track => {
                if (track === null) {
                    res.json({
                        error: true,
                        msg: 'Can not found your track',
                        code: 'missing_result_object',
                    })
                    return false;
                }
                // If the user already fave the track, just remove it, if not add one
                user.fave.forEach(faveStackID => {
                    if (faveStackID.toString() == id) {
                        findFave = true;
                    }
                });

                if (findFave) {
                    res.json({
                        fave: true,
                    })
                }else{
                    res.json({
                        fave: false,
                    })
                }
            });
        }
    })
    .catch(error => {
        console.log(error);
    })
});


module.exports = router;