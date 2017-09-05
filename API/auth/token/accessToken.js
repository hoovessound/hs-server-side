const express = require('express');
const router = new express.Router;
const oAuthApps = require('../../../schema/oAuthApps');
const TempTokes = require('../../../schema/TempTokes');
const AccessTokes = require('../../../schema/AccessTokes');
const crypto = require('crypto');
const moment = require('moment');

router.post('/', (req, res) => {
    const clientId = req.body.client_id;
    const clientSecret = req.body.client_secret;
    const token = req.body.token;

    if(!clientId){
        res.json({
            error: true,
            msg: 'Missing the client ID',
            code: 'missing_require_fields',
        });
        return false;
    }
    if(!clientSecret){
        res.json({
            error: true,
            msg: 'Missing the client secret',
            code: 'missing_require_fields',
        });
        return false;
    }
    if(!token){
        res.json({
            error: true,
            msg: 'Missing the token',
            code: 'missing_require_fields',
        });
        return false;
    }

    oAuthApps.findOne({
        clientId,
        clientSecret,
    })
    .then(app => {
        if(app === null){
            res.json({
                error: true,
                msg: 'Bad client ID or secret',
                code: 'bad_authentication',
            });
            return false;
        }
        return TempTokes.findOne({
            token,
        })
    })
    .then(rightAccess => {
        if(rightAccess === null){
            res.json({
                error: true,
                msg: 'Can\'t not that temporary token',
                code: 'unexpected_result',
            });
            return false;
        }

        if(rightAccess.timestamp.end > moment()._d ){
            res.json({
                error: true,
                msg: 'Your temporary token has expired',
                code: 'service_lock_down',
            });
            TempTokes.remove({
                token,
            });
            return false;
        }

        // Give this application an access token
        const accessToken = crypto.randomBytes(255).toString('hex');

        // Save the new access token and remove the temporary token
        const currentTime = console.log(moment()._d);
        const endTime = moment(currentTime).add(1, 'minutes');
        return new AccessTokes({
            token: accessToken,
            timestamp: {
                start: currentTime,
                end: endTime,
            },
            author: {
                app: rightAccess.author.app,
                user: rightAccess.author.user,
            },
        })
        .save()
        .then(() => {

            res.json({
                access_token: accessToken,
                expire: endTime,
            })

            return TempTokes.remove({
                token,
            })
        })
    })
    .catch(error => {
        console.log(error);
    })
});

module.exports = router;