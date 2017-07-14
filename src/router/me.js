const express = require('express');
const router = express.Router();
const rp = require('request-promise');
const fullurl = require('fullurl');
const Users = require('../../schema/Users');
const Tracks = require('../../schema/Tracks');

router.get('/', (req, res) => {
    const full_address = req.protocol + "://" + req.headers.host;
    if(!req.cookies['oauth-token']){
        res.redirect('/api/auth/login?redirect=' + fullurl(req));
    }else{
        const token = req.cookies['oauth-token'];

        Users.findOne({
            token: token,
        }).then(user => {
            if (user === null) {
                res.redirect('/api/auth/login?redirect=' + fullurl(req));
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
                        });
                    });
                })
            }
        }).catch(error => {
            console.log(error)
        })
    }
});

router.get('/fave?', (req, res) => {
    const full_address = req.protocol + "://" + req.headers.host;
    if(!req.cookies['oauth-token']){
        res.redirect('/api/auth/login?redirect=' + fullurl(req));
    }else{
        const token = req.cookies['oauth-token'];

        rp.get({
            url: `${full_address}/api/user/token/${token}`,
            headers: {
                token,
            }
        })
        .then(user => {
            user = JSON.parse(user);
            // Get the user's fave tracks

            // If the user didn't have any tracks yet, just render the page
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
            }

            let tracks = [];
            user.fave.forEach(id => {
                return Promise.all([
                    rp.get({
                        url: `${full_address}/api/track?id=${id}`,
                        headers: {
                            token,
                        }
                    }),
                ])
                .then(track => {
                    track = JSON.parse(track);
                    tracks.push(track);
                    if(tracks.length === user.fave.length){
                        // Finish finding the track object
                        res.render('fave', {
                            loginUser: user,
                            tracks: {
                                tracks,
                            },
                            token,
                            full_address,
                        });
                    }
                })
            });
        })
        .catch(error => {
            console.log(error);
        })
    }
});

module.exports = router;