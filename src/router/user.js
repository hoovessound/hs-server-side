const express = require('express');
const router = express.Router();
const rp = require('request-promise');
const fullurl = require('fullurl');
const Users = require('../../schema/Users');
const Tracks = require('../../schema/Tracks');

router.get('/:username?', (req, res) => {
    const full_address = req.protocol + "://" + req.headers.host;
    if(!req.cookies['oauth-token']){
        res.redirect('/api/auth/login?redirect=' + fullurl(req));
    }else{
        const username = req.params.username;
        const rp = require('request-promise');
        const token = req.cookies['oauth-token'];

        Users.findOne({
            token,
        }).then(user => {
            if(user === null){
                res.redirect('/api/auth/login?redirect=' + fullurl(req));
            }else{
                return Users.findOne({
                    username,
                }).then(profile => {
                    return Tracks.find({
                        'author.username': profile.username,
                        private: false || null,
                    }).sort({
                        uploadDate: -1
                    }).then(tracks => {
                        res.render('profile', {
                            loginUser: user,
                            profile,
                            tracks,
                            full_address,
                        });
                    })
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