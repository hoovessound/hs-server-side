const express = require('express');
const router = express.Router();
const rp = require('request-promise');
const fullurl = require('fullurl');
const Users = require('../../schema/Users');
const Tracks = require('../../schema/Tracks');

router.get('/:username?/:title?', (req, res) => {
    const full_address = req.protocol + "://" + req.headers.host;
    if(!req.cookies['oauth-token']){
        res.redirect('/api/auth/login?redirect=' + fullurl(req));
    }else{
        const username = req.params.username;
        const title = req.params.title;
        const rp = require('request-promise');
        const token = req.cookies['oauth-token'];

        Users.findOne({
            token,
        }).then(user => {
            if(user === null){
                res.redirect('/api/auth/login?redirect=' + fullurl(req));
            }
            return Tracks.findOne({
                'author.username': username,
                title: title
            }).then(track => {
                // Find out if the user fave this track or not
                return rp.get({
                    url: `${full_address}/api/track/fave/isfave/${track._id}`,
                    headers: {
                        token,
                    }
                }).then(isFave => {
                    isFave = JSON.parse(isFave);
                    res.render('track', {
                        loginUser: user,
                        track,
                        comments: track.comments,
                        full_address,
                        token,
                        isFave: isFave.fave ? 'isFave': 'notFave',
                    });
                })
            });
        }).catch(error => {
            console.log(error);
        })
    }
});

module.exports = router;