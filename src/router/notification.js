const express = require('express');
const router = express.Router();
const cors = require('cors');
const oAuthApps = require('../../schema/oAuthApps');
const Users = require('../../schema/Users');
const AccessTokes = require('../../schema/AccessTokes');
const jwt = require('jsonwebtoken');
const notification = require('../helper/notification');

router.use(cors());

// Authoriz APIs
router.use((req, res, next) => {
    const bypass = req.query.bypass;
    const service = req.query.service;
    // In site use case

    if(bypass === 'true' || service){
        // Check for the host name
        const token = req.query.jwt;
        if(!token){
            res.json({
                error: `Please provide the authorization token`,
                code: 'bad_authentication',
            });
            return false;
        }
        jwt.verify(token, process.env.JWTTOKEN, (error, data) => {
            if(error){
                res.json({
                    error: `Bad authorization token`,
                    code: 'bad_authentication',
                });
            }else{
                Users.findOne({
                    id: data.id,
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
                        };
                        next();
                    }
                })
                .catch(error => {
                    console.log(error);
                })
            }
        });
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

router.post('/enable', async function(req, res) {
    const fcmToken = req.body.token;
    if(!fcmToken){
        res.status(403);
        res.json({
            error: 'Missing FCM token',
        });
        return false;
    }else{
        try{
            const user = req.hsAuth.user;
            user.sendPushNotification = true;
            if(!user.fcmTokens.includes(fcmToken)){
                // Save the new FCM token to the current user
                user.fcmTokens.push(fcmToken);
            }
            await Users.update({
                _id: req.hsAuth.user._id,
            }, user);
            res.json({
                done: true,
            });
        }
        catch(error){
            res.status(500);
            console.error(error);
            res.json({
                error,
            });
        }
    }
});

router.delete('/disable', async function(req, res) {
    try{
        const user = req.hsAuth.user;
        user.sendPushNotification = false;
        await Users.update({
            _id: req.hsAuth.user._id,
        }, user);
        res.json({
            done: true,
        });
    }
    catch(error){
        res.status(500);
        console.error(error);
        res.json({
            error,
        });
    }
});

router.post('/send', async function(req, res){
    if(!req.hsAuth.user.sendPushNotification){
        res.status(403);
        res.json({
            error: 'User has disabled or haven\'t enable push notification yet',
        });
        return false;
    }
    try{
        const response = await notification(req.body.to, req.body.notification, req.body.options);
        res.json({
            done: true,
            response,
        });
    }
    catch(error){
        res.json(error)
    }
});

router.all('*', (req, res) => {
    res.status(404);
    res.json({
        error: 'API endpoint not found',
        docs_url: 'https://developer.hoovessound.ml/api/docs',
    });
});

module.exports = router;