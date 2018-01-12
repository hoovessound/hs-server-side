const express = require('express');
const router = express.Router();
const cors = require('cors');
const limiter = require('express-better-ratelimit_hs_specific');
const oAuthApps = require('../../schema/oAuthApps');
const Users = require('../../schema/Users');
const AccessTokes = require('../../schema/AccessTokes');

router.use('/oauth2/token/access', require('../../API/auth/token/accessToken'));

// Third party oAuth
router.use('/oauth2/thirdparty/poniverse', require('../../API/auth/thirdparty/poniverse'));
router.use('/oauth2/thirdparty/facebook', require('../../API/auth/thirdparty/facebook'));

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

// GET APIs
router.use('/tracks', require('../../API/GET/tracks'));
router.use('/track', require('../../API/GET/track'));
router.use('/image', require('../../API/GET/image'));
router.use('/search', require('../../API/GET/search'))
router.use('/doodle', require('../../API/GET/doodle'));
router.use('/playlist', require('../../API/GET/playlist'));
router.use('/user', require('../../API/GET/user'));

// Authoriz APIs
router.use((req, res, next) => {
    const bypass = req.query.bypass;
    const service = req.query.service;
    // In site use case

    if(bypass === 'true' || service){
        // Check for the host name
        const token = req.query.oauth_token;
        Users.findOne({
            token,
        })
        .then(user => {
            if(!user){
                res.json({
                    error: `Bad oauth token`,
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
            console.log(error);
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
            req.hsAuth = {
                user,
                app: _rightAccess,
                isNormalApiCall: true,
            };
            next();
        })
        .catch(error => {
            console.log(error);
        })
    }
});

router.use('/me', require('../../API/GET/me'));
router.use('/notification', require('../../API/GET/notification'));

// POST APIs

router.use('/upload', require('../../API/POST/upload'));

router.use('/track', require('../../API/POST/track'));

router.use('/settings', require('../../API/POST/settings'));

router.use('/notification', require('../../API/POST/notification'));

router.use('/events', require('../../API/POST/events'));

router.use('/playlist', require('../../API/POST/playlist'));

router.use('/doodle', require('../../API/POST/doodle'));


router.all('*', (req, res) => {
    res.status(404);
    res.json({
        error: 'API endpoint not found',
        docs_url: 'https://developer.hoovessound.ml/api/docs',
    });
});

module.exports = router;