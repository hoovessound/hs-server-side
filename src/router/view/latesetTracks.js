const express = require('express');
const router = express.Router();
const rp = require('request-promise');
const fullurl = require('fullurl');
const Users = require('../../../schema/Users');
const Tracks = require('../../../schema/Tracks');

router.get('/', (req, res) => {
    const full_address = req.protocol + "://" + req.headers.host;
    const offset = req.query.offset || 0;
    const token = req.cookies['oauth-token'];
    if(!req.cookies['oauth-token']){
        res.end('Access denied');
    }else{

        Users.findOne({
            token: token,
        }).then(user => {
            if(user === null){
                res.end('Access denied');
                return false;
            }else{
                return Tracks.find({
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
                }).limit(10).skip(parseInt(offset)).sort({
                    uploadDate: -1
                }).then(tracks => {
                    tracks.forEach((track, index) => {
                        return Users.findOne({
                            id: track.author,
                        })
                        .then(user => {
                            const username = user.username;
                            const fullName = user.fullName;
                            tracks[index].author = {
                                username,
                                fullName,
                            };
                            if(tracks.length === (index + 1) ){
                                // Finish
                                res.render('tracks', {
                                    tracks,
                                    full_address,
                                    token,
                                    offset,
                                    track: tracks[0],
                                });
                            }
                        })
                        .catch(error => {
                            console.log(error);
                        })
                    })   
                })
            }
        }).catch(error => {
            console.log(error)
        })
    }
});

module.exports = router;