const express = require('express');
const router = express.Router();
const cors = require('cors');
const limiter = require('express-better-ratelimit_hs_specific');
const oAuthApps = require('../../../schema/oAuthApps');
const Users = require('../../../schema/Users');
const AccessTokes = require('../../../schema/AccessTokes');

router.use('/widget', require('../../../API/widget'));

router.use('/oauth2/token/access', require('../../../API/auth/token/accessToken'));

// Third party oAuth
router.use('/oauth2/thirdparty/poniverse', require('../../../API/auth/thirdparty/poniverse'));
router.use('/oauth2/thirdparty/facebook', require('../../../API/auth/thirdparty/facebook'));

router.use(cors());

router.use(limiter({
    // duration: 900000, // 15 min
    max: 500,
    accessLimited: {
        error: 'Too many request for this IP address, please read the API rate limit docs',
        code: 'service_lock_down',
    }
}));

// Authoriz-free APIs

router.use('/tracks', require('../../../API/home'));

router.use('/image', require('./../../../API/image'));

router.use('/search', require('../../../API/search'));

// Basic API auth
router.use((req, res, next) => {
    const bypass = req.query.bypass;
    const service = req.query.service;
    // In site use case

    if(bypass === 'true' || service){
        // Check for the host name
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const sessionToken = req.headers.sessiontoken;
        const token = req.query.oauth_token;
        Users.findOne({
            token,
        })
        .then(user => {
            if(user === null){
                res.json({
                    error: `Not authenticated domain`,
                    code: 'bad_authentication',
                });
                return false;
            }else{
                req.hsAuth = {
                    token,
                    user,
                    isNormalApiCall: false,
                }
                next();
            }
        })
        .catch(error => {
            if(error.message.includes('Cast to ObjectId failed for value')){
                res.json({
                    error: `Not authenticated domain`,
                    code: 'bad_authentication',
                });
                return false;
            }else{
                console.log(error)
            }
        })
    }else{
        // Normal API calls
        const accessToken = req.headers.authorization || req.headers.access_token || req.query.access_token;
        let _rightAccess;
        AccessTokes.findOne({
            token: accessToken,
        })
        .then(rightAccess => {
            _rightAccess = rightAccess;
            if(rightAccess === null){
                res.json({
                    error: 'Bad access token',
                    code: 'bad_authentication',
                });
                return false;
            }
            return Users.findOne({id: rightAccess.author.user});
        })
        .then(user => {
            // Rate limit control
            req.hsAuth = {
                user,
                app: _rightAccess,
            };
            next();
        })
        .catch(error => {
            console.log(error);
        })
    }
});


router.use('/me', require('../../../API/me'));

router.use('/upload', require('../../../API/upload'));

router.use('/track', require('../../../API/track'));

router.use('/settings', require('../../../API/settings'));

router.use('/notification', require('./../../../API/notification'));

router.use('/doodle', require('./../../../API/doodle'));

router.use('/events', require('./../../../API/events'));

router.use('/user', require('./../../../API/user'));


router.all('*', (req, res) => {
    res.status(404);
    res.json({
        error: 'API endpoint not found',
        docs_url: 'https://developer.hoovessound.ml/api/docs',
    });
});

module.exports = router;