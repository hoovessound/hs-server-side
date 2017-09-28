const express = require('express');
const router = express.Router();
const rp = require('request-promise');
const fullurl = require('fullurl');
const Users = require('../../../schema/Users');
const Tracks = require('../../../schema/Tracks');

router.get('/', (req, res) => {
    const full_address = req.protocol + "://" + req.headers.host;
    if(!req.cookies['oauth-token']){
        res.end('Access denied');
    }else{
        const token = req.cookies['oauth-token'];

        Users.findOne({
            token: token,
        }).then(user => {
            if (user === null) {
                res.end('Access denied');
                return false;
            }else{
                Users.findOne({
                    token,
                }).then(user => {
                    // Find user's tracks
                    const offset = parseInt(req.query.offset) || 0;
                    return Tracks.find({
                        'author.username': user.username,
                    }).limit(10).skip(offset).sort({uploadDate: -1}).then(tracks => {
                        res.render('profile', {
                            loginUser: user,
                            profile: user,
                            tracks: tracks,
                            full_address,
                            token,
                        });
                    });
                })
            }
        }).catch(error => {
            console.log(error)
        })
    }
});

router.get('/fave', (req, res) => {
    const full_address = req.protocol + "://" + req.headers.host;
    if(!req.cookies['oauth-token']){
        res.redirect('/api/auth/login?redirect=' + fullurl(req));
    }else{
        const token = req.cookies['oauth-token'];
        Users.findOne({
            token: token,
        })
        .then(user => {
            if (user === null) {
                res.redirect('/api/auth/login?redirect=' + fullurl(req));
            }else{
                if(user.fave.length <= 0){
                    res.render('fave', {
                        loginUser: user,
                        tracks: {
                            tracks: [],
                        },
                        token,
                        full_address,
                    });
                    return false;
                }else{
                    // User did fave a track(s)
                    // Get the track info
                    let tracks = [];
                    user.fave.forEach(id => {
                        return Tracks.findOne({
                            id: id,
                        }).then(track => {
                            tracks.push(track);
                            if(tracks.length === user.fave.length){
                                res.render('fave', {
                                    loginUser: user,
                                    tracks: {
                                        tracks,
                                    },
                                    token,
                                    full_address,
                                });
                                return false;
                            }
                        });
                    });
                }
            }
        }).catch(error => {
            console.log(error);
        });
    }
});

module.exports = router;