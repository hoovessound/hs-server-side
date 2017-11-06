const express = require('express');
const router = express.Router();
const fullurl = require('fullurl');
const Users = require('../../../schema/Users');
const Tracks = require('../../../schema/Tracks');
const randomstring = require('randomstring');
const parseDomain = require('parse-domain');


let socketConnection = {};
module.exports.socketConnection = socketConnection;

router.use('/render/track', require('./track'));

router.use('/render/upload', require('./upload'));

router.use('/render/me', require('./me'));

router.use('/render/user', require('./user'));

router.use('/render/search', require('./search'));

router.use('/render/settings', require('./settings'));

router.use('/render/tracks', require('./latesetTracks'));

router.use('/render/notification', require('./notification'));

router.use('/render/oauth-app', require('./oAuthApp'));

router.all('/error/404', (req, res) => {
    res.send('<h1>404</h1><br><p>Page not find :/</p>')
});

const reLogin = function(req, res) {
    res.redirect(`${req.protocol}://id.${req.get('host')}${req.originalUrl}?redirect=${fullurl(req)}&service=hs_service_login`);
}

router.get('*', (req, res) => {
    const domain = parseDomain(req.hostname);
    const full_address = {
        domain: domain.domain,
        tld: domain.tld,
        protocol: req.protocol,
        host: req.get('host'),
    }

    const token = req.cookies['oauth-token'];
    if(!req.cookies['oauth-token']){
        reLogin(req, res);
    }else{
        Users.findOne({
            token: token,
        }).then(user => {
            if (user === null) {
                reLogin(req, res);
            } else {
                req.session.sessionToken = randomstring.generate(10);
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
                    const lastTrack = track;
                    if(typeof user.lastPlay.trackID !== 'undefined'){
                        // Fetch the last track object
                        return Tracks.findOne({
                            id: user.lastPlay.trackID,
                        })
                        .then(track => {
                            if(track === null){
                                res.render('index', {
                                    loginUser: user,
                                    track: lastTrack,
                                    full_address,
                                    token,
                                    totalPage: 0,
                                    offset: 10,
                                    year: new Date().getFullYear(),
                                    initAudioSource: `${full_address}/api/listen/${lastTrack.id}`,
                                    volume: 100,
                                    sessionToken: req.session.sessionToken,
                                });
                            }else{
                                res.render('index', {
                                    loginUser: user,
                                    track: track,
                                    full_address,
                                    token,
                                    totalPage: 0,
                                    offset: 10,
                                    year: new Date().getFullYear(),
                                    initAudioSource: `${full_address}/api/listen/${track.id}`,
                                    volume: user.lastPlay.volume,
                                    playTimeValue: true,
                                    sessionToken: req.session.sessionToken,
                                });
                            }
                        })
                    }else{
                        res.render('index', {
                            loginUser: user,
                            track,
                            full_address,
                            token,
                            totalPage: 0,
                            offset: 10,
                            year: new Date().getFullYear(),
                            initAudioSource: `${full_address}/api/listen/${track.id}`,
                            volume: 100,
                            sessionToken: req.session.sessionToken,
                        });
                    }
                })
            }
        })
        .catch(error => {
            console.log(error);
        });
    }
});

module.exports = router;