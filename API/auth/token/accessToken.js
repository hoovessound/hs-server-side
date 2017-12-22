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
            error: 'Missing the client ID',
            code: 'missing_require_fields',
        });
        return false;
    }
    if(!clientSecret){
        res.json({
            error: 'Missing the client secret',
            code: 'missing_require_fields',
        });
        return false;
    }
    if(!token){
        res.json({
            error: 'Missing the token',
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
                error: 'Bad client ID or secret',
                code: 'bad_authentication',
            });
            return false;
        }
        return TempTokes.findOne({
            token,
        })
    })
    .then(rightAccess => {
        if(!rightAccess){
            res.json({
                error: 'Can\'t not that authorization token',
                code: 'unexpected_result',
            });
            return false;
        }

        const expired = moment(rightAccess.timestamp.end).isBefore(moment()._d)

        if(expired){
            res.json({
                error: 'Your temporary token has expired',
                code: 'service_lock_down',
            });
            return TempTokes.remove({
                token,
            })
        }


        // Give this application an access token

        // If the user did have an access toke before and have the same scope permission

        AccessTokes.findOne({
            'author.user': rightAccess.author.user,
            permission: rightAccess.permission,
        })
        .then(oldAccessToken => {
            if(!oldAccessToken){
                // Didn't have any OAuth app before
                createTokenAndResposne();
            }else{
                const oldEndTime = oldAccessToken.timestamp.end;
                const oldexpired = moment(oldEndTime).isBefore(moment()._d);
                // And that access toek didn't expired yet
                if(!oldexpired){
                    // Just use the old one
                    res.json({
                        access_token: oldAccessToken.token,
                        expire: oldEndTime
                    })
        
                    return TempTokes.remove({
                        token,
                    })
                }else{
                    // It expired lolz
                    
                    // Remove that old and make a new one

                    AccessTokes.remove({
                        _id: oldAccessToken._id,
                    })
                    .then(() => {
                        createTokenAndResposne();
                    })
                }
            }
        })


        function createTokenAndResposne(){
            const accessToken = crypto.randomBytes(255).toString('hex');
            // Save the new access token and remove the temporary token
            const currentTime = moment()._d;
            const endTime = moment(currentTime).add(1, 'years');
            console.log(rightAccess.author.app)
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
                permission: rightAccess.permission,
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
        }

    })
    .catch(error => {
        console.log(error);
    })
});

module.exports = router;