const express = require('express');
const router = express.Router();
const cors = require('cors');
const oAuthApps = require('../../../schema/oAuthApps');
const Users = require('../../../schema/Users');
const AccessTokes = require('../../../schema/AccessTokes');
router.use(cors());

router.use('/listen', require('../../../API/listen'));

router.use('/widget', require('../../../API/widget'));

router.use('/auth/register', require('../../../API/auth/register'));

router.use('/auth/login', require('../../../API/auth/login'));

router.use('/auth/changepassword', require('../../../API/auth/changepassword'));

router.use('/oauth1/token/temporary', require('../../../API/auth/token/tempToken'));

router.use('/oauth1/token/access', require('../../../API/auth/token/accessToken'));

// Third party oAuth
router.use('/oauth1/thirdparty/poniverse', require('../../../API/auth/thirdparty/poniverse'));
router.use('/oauth1/thirdparty/facebook', require('../../../API/auth/thirdparty/facebook'));

// Basic API auth
router.use((req, res, next) => {
    const bypass = req.query.bypass;
    const service = req.query.service;
    // In site use case

    if(bypass === 'true' || service === 'hs_service_login'){
        // Check for the host name
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const sessionToken = req.headers.sessiontoken;
        const token = req.headers.token;
        console.log(sessionToken)
        console.log(req.session.sessionToken)
        if(sessionToken === req.session.sessionToken){
            Users.findOne({
                token,
            })
            .then(user => {
                if(user === null){
                    res.json({
                        error: true,
                        msg: 'Can\'t not found your user id',
                        code: 'bad_authentication',
                    });
                    return false;
                }else{
                    req.hsAuth = {
                        token,
                        user,
                    }
                    next();
                }
            })
            .catch(error => {
                if(error.message.includes('Cast to ObjectId failed for value')){
                    res.json({
                        error: true,
                        msg: 'Can\'t not found your user id',
                        code: 'bad_authentication',
                    });
                    return false;
                }else{
                    console.log(error)
                }
            })
        }else{
            res.json({
                error: true,
                msg: `Not authenticated domain`,
                code: 'bad_authentication',
            });
            return false;
        }
    }else{
        // Normal API calls
        const accessToken = req.headers.access_token;
        let _rightAccess;
        AccessTokes.findOne({
            token: accessToken,
        })
        .then(rightAccess => {
            _rightAccess = rightAccess;
            if(rightAccess === null){
                res.json({
                    error: true,
                    msg: 'Bad access token',
                    code: 'bad_authentication',
                });
                return false;
            }
            return Users.findOne({_id: rightAccess.author.user});
        })
        .then(user => {
            req.hsAuth = {
                user,
                app: _rightAccess,
            }
            next();
        })
        .catch(error => {
            console.log(error);
        })
    }
});


router.use('/tracks', require('../../../API/home'));

router.use('/me', require('../../../API/me'));

router.use('/upload', require('../../../API/upload'));

router.use('/user', require('../../../API/user'));

router.use('/track', require('../../../API/track'));

router.use('/search', require('../../../API/search'));

router.use('/settings', require('../../../API/settings'));

router.use('/notification', require('./../../../API/notification'));

router.all('*', (req, res) => {
    res.json({
        error: 'API endpoint not found',
        docs_url: 'https://hoovessound.ml/developer/docs',
    });
});

module.exports = router;