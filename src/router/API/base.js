const express = require('express');
const router = express.Router();
const cors = require('cors');
const oAuthApps = require('../../../schema/oAuthApps');
const Users = require('../../../schema/Users');
router.use(cors());

router.use('/auth/register', require('../../../API/auth/register'));

router.use('/auth/login', require('../../../API/auth/login'));

router.use('/auth/changepassword', require('../../../API/auth/changepassword'));

router.use('/listen', require('../../../API/listen'));

// Basic API auth
router.use((req, res, next) => {
    const id = req.headers['client_id'];
    const secret = req.headers['client_secret'];
    const bypass = req.query.bypass;

    // In site use case

    if(bypass === 'true'){
        // Check for the host name
        const origin = req.headers.origin;
        const token = req.headers.token;
        if(origin === 'http://localhost:3000' || origin === 'https://hoovessound.ml'){
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
                msg: 'Not authenticated domain',
                code: 'bad_authentication',
            });
            return false;
        }
    }else{
        // Normal API calls

        Promise.all([
            oAuthApps.findOne({
                clientId: id,
                clientSecret: secret,
            })
        ])
        .then(data => {
            if(data[0] === null || data[1] === null){
                res.json({
                    error: true,
                    msg: 'Bad client ID or secret',
                    code: 'bad_authentication'
                });
                return false;
            }

            req.hsAuth = {
                clientId: id,
                clientSecret: secret,
            };

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

router.use('/comment', require('../../../API/comment'));

router.use('/widget', require('../../../API/widget'));

router.use('/notification', require('./../../../API/notification'));

module.exports = router;