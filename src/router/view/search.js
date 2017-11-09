const express = require('express');
const router = express.Router();
const rp = require('request-promise');
const fullurl = require('fullurl');
const Users = require('../../../schema/Users');
const Tracks = require('../../../schema/Tracks');

router.get('/:query?', (req, res) => {
    const full_address = req.protocol + "://" + req.headers.host;
    if(!req.cookies['oauth-token']){
        res.end('Access denied');
    }else{
        const token = req.cookies['oauth-token'];
        const query = req.params.query ? req.params.query.trim() : null;
        Users.findOne({
            token: token,
        }).then(user => {
            if (user === null) {
                res.end('Access denied');
            }else{
                if(query === null){
                    res.redirect('/');
                    return false;
                }

                if(query.length <= 0){
                    res.redirect('/');
                    return false;
                }

                function escapeRegex(text) {
                    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
                };
                const regex = new RegExp(escapeRegex(query), 'ig');

                return Promise.all([
                    Users.find({
                        $or: [
                            {
                                username: regex,
                            },
                            {
                                fullName: regex,
                            }
                        ]
                    }, {
                        password: 0,
                        tracks: 0,
                        token: 0,
                    }),
                    Tracks.find({
                        title: regex,
                        $or: [
                            {
                                private: false,
                            },
                            {
                                private: {
                                    $exists: false,
                                }
                            }
                        ]
                    }, {
                        file: 0,
                    })
                ])
                .then(response => {
                    // Fetch the tracks author info
                    const tracks = response[1];
                    if(tracks.length >= 1){
                        tracks.forEach((track, index) => {
                            return Users.findOne({
                                id: track.author,
                            })
                            .then(trackUser => {
                                tracks[index].author = {
                                    username: trackUser.username,
                                    fullName: trackUser.fullName,
                                }

                                if(tracks.length === (index + 1)){
                                    res.render('search', {
                                        loginUser: user,
                                        users: response[0],
                                        tracks,
                                        full_address,
                                        token,
                                    });
                                }
                            })
                            .catch(error => {
                                console.log(error);
                            })
                        })
                    }else{
                        res.render('search', {
                            loginUser: user,
                            users: response[0],
                            tracks: [],
                            full_address,
                            token,
                        });
                    }
                    
                })

            }
        }).catch(error => {
            console.log(error);
        });
    }
});

module.exports = router;