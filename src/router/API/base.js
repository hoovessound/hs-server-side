const express = require('express');
const router = express.Router();
const cors = require('cors');
const oAuthApps = require('../../../schema/oAuthApps');
router.use(cors());

router.use('/auth/register', require('../../../API/auth/register'));

router.use('/auth/login', require('../../../API/auth/login'));

router.use('/auth/changepassword', require('../../../API/auth/changepassword'));

// Basic API auth
router.use((req, res, next) => {
    const id = req.headers['client_id'];
    const secret = req.headers['client_secret'];

    Promise.all([
        oAuthApps.findOne({
            clientId: id,
            clientSecret: secret,
        })
    ])
    .then(data => {
        if(data[0] === null){
            res.json({
                error: true,
                msg: 'Bad client ID',
                code: 'bad_authentication'
            });
            return false;
        }

        if(data[1] === null){
            res.json({
                error: true,
                msg: 'Bad client secret',
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
});

router.use('/tracks', require('../../../API/home'));

router.use('/me', require('../../../API/me'));

router.use('/upload', require('../../../API/upload'));

router.use('/listen', require('../../../API/listen'));

router.use('/user', require('../../../API/user'));

router.use('/track', require('../../../API/track'));

router.use('/search', require('../../../API/search'));

router.use('/settings', require('../../../API/settings'));

router.use('/comment', require('../../../API/comment'));

router.use('/widget', require('../../../API/widget'));

router.use('/notification', require('./../../../API/notification'));

module.exports = router;