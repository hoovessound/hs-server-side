const express = require('express');
const router = express.Router();
const Users = require('../../../schema/Users');
const Tracks = require('../../../schema/Tracks');
const fullurl = require('fullurl');

router.use('/render/track', require('./track'));

router.use('/render/upload', require('./upload'));

router.use('/render/me', require('./me'));

router.use('/render/user', require('./user'));

router.use('/render/search', require('./search'));

router.use('/render/settings', require('./settings'));

router.use('/render/widget', require('./widget'));

router.use('/render/tracks', require('./latesetTracks'));

router.get('*', (req, res) => {
    const full_address = req.protocol + "://" + req.headers.host;
    const token = req.cookies['oauth-token'];
    if(!req.cookies['oauth-token']){
        res.redirect('/api/auth/login?redirect=' + fullurl(req));
    }else{
        Users.findOne({
            token: token,
        }).then(user => {
            if (user === null) {
                res.redirect('/api/auth/login?redirect=' + fullurl(req));
                return false;
            } else {

                return Tracks.findOne({
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
                }).limit(1).sort({
                    uploadDate: -1
                }).then(track => {
                    res.render('index', {
                        loginUser: user,
                        track,
                        full_address,
                        token,
                        totalPage: 0,
                        offset: 10,
                        isFave: false,
                    });
                })
            }
        });
    }
});

module.exports = router;