const express = require('express');
const router = new express.Router;
const rp = require('request-promise');
const Users = require('../../../schema/Users');
const crypto = require('crypto');
const genId = require('../../../src/helper/genId');
const oAuthApps = require('../../../schema/oAuthApps');
const TempTokes = require('../../../schema/TempTokes');


const pvAuthObject = {
    appId: process.env.PV_CLIENT_ID,
    appSecret: process.env.PV_SECRET,
};

router.get('/', (req, res) => {
    const fullUrl = req.protocol + '://' + req.get('host');
    // Get the tmp token
    const url = `https://poniverse.net/oauth/authorize?response_type=code&client_id=${pvAuthObject.appId}&redirect_uri=${fullUrl}/api/oauth1/thirdparty/poniverse/callback`;
    res.redirect(url);
});

router.get('/callback', (req, res) => {
    const fullUrl = req.protocol + '://' + req.get('host');
    // Get the access token
    const code = req.query.code;
    let accessToken;
    let _profile;
    const url = `https://poniverse.net/oauth/access_token?grant_type=authorization_code&code=${code}&redirect_uri=${fullUrl}/api/oauth1/thirdparty/poniverse/callback&client_id=${pvAuthObject.appId}&client_secret=${pvAuthObject.appSecret}`;
    rp.get({
        url,
        json: true,
    })
    .then(response => {
        accessToken = response.access_token;
        // Find that user's email address
        const profileUrl = `https://api.poniverse.net/v1/users/me?access_token=${accessToken}`;
        return rp.get({
            url: profileUrl,
            json: true
        });
    })
    .then(profile => {
        _profile = profile;
        // See if that user already sign up for HS
        return Users.findOne({
            email: profile.email,
        })

    })
    .then(user => {
        if(user === null) {
            // New user
            const randomBytes = crypto.randomBytes(50);
            const token = randomBytes.toString('hex');
            return new Users({
                id: genId(40),
                fullName: _profile.display_name,
                username: _profile.username,
                token,
                email: _profile.email,
                thirdparty: {
                    provider: 'poniverse',
                    token: accessToken,
                }
            })
            .save()
            .then(() => {
                res.cookie('oauth-token', token, {
                    maxAge: 365 * 24 * 60 * 60,
                    httpOnly: true,
                });

                if(req.query.service) {
                    res.redirect('/home');
                }else{
                    res.redirect(`/api/oauth1/token/temporary?${req.session.rawQuery}`);
                }
            })

        }else{
            // Old user

            // Bind the data to the old account

            if(user.thirdparty.provider !== 'poniverse') {
                user.thirdparty = {
                    provider: 'poniverse',
                    token: accessToken,
                }
            }

            res.cookie('oauth-token', user.token, {
                maxAge: 365 * 24 * 60 * 60,
                httpOnly: true,
            });

            if(req.query.service) {
                res.redirect('/home');
            }else{
                res.redirect(`/api/oauth1/token/temporary?${req.session.rawQuery}`);
            }

            return Users.update({
                _id: user._id
            }, user)
        }
    })
    .catch(error => {
        // lol
    })
});

module.exports = router;