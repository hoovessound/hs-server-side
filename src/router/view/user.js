const express = require('express');
const router = express.Router();
const rp = require('request-promise');
const fullurl = require('fullurl');
const Users = require('../../../schema/Users');
const Tracks = require('../../../schema/Tracks');

router.get('/:username?', (req, res) => {
    const full_address = req.protocol + "://" + req.headers.host;
    if(!req.cookies['oauth-token']){
        res.end('Access denied');
    }else{
        const username = req.params.username;
        const rp = require('request-promise');
        const token = req.cookies['oauth-token'];

        Users.findOne({
            token,
        }).then(user => {
            if(user === null){
                res.end('Access denied');
            }else{
                return Users.findOne({
                    username,
                }).then(profile => {
                    if(profile){
                        // Check if the user is the ownUser
                        const ownUser = profile.username === user.username ? true:false;
                        let searchQuery;
                        if(ownUser){
                            searchQuery = {
                                author: profile.id,
                            }
                        }else{
                            searchQuery = {
                                author: profile.id,
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
                            }
                        }
                        
                        return Tracks.find(searchQuery).sort({
                            uploadDate: -1
                        }).then(tracks => {
                            tracks.forEach((track, index) => {
                                tracks[index].author = {
                                    username: profile.username,
                                    fullName: profile.fullName,
                                }
                            });
                            res.render('profile', {
                                loginUser: user,
                                profile,
                                tracks,
                                full_address,
                                token,
                            });
                        })
                    }else{
                        // lol
                    }
                })
            }
        }).catch(error => {
            console.log(error)
        })

        rp.get({
            url: `${full_address}/api/user/token/${token}`,
            headers: {
                token,
            }
        })
        .then(user => {
            user = JSON.parse(user);
            // Try to find the user's info
            rp.get({
                url: `${full_address}/api/user/username/${username}`,
                headers: {
                    token,
                }
            })
            .then(profile => {
                profile = JSON.parse(profile);
            })
        })
        .catch(error => {
            console.log(error);
        })
    }
});

module.exports = router;