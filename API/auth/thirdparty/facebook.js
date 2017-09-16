const express = require('express');
const router = new express.Router;
const rp = require('request-promise');
const Users = require('../../../schema/Users');
const crypto = require('crypto');


const fbAuthObject = {
    appId: process.env.FB_CLIENT_ID,
    appSecret: process.env.FB_SECRET,
    callbackURL: 'http://localhost:3000/api/oauth1/thirdparty/facebook/callback',
};

router.get('/', (req, res) => {
    // Get the tmp token
    const url = `https://www.facebook.com/v2.10/dialog/oauth?client_id=${fbAuthObject.appId}&redirect_uri=${fbAuthObject.callbackURL}&response_type=code`;
    res.redirect(url);
});

router.get('/callback', (req, res) => {
    // Get the access token
    const code = req.query.code;
    let accessToken;
    let _profile;
    const url = `https://graph.facebook.com/v2.10/oauth/access_token?client_id=${fbAuthObject.appId}&client_secret=${fbAuthObject.appSecret}&code=${code}&redirect_uri=${fbAuthObject.callbackURL}`;
    rp.get({
        url,
        json: true,
    })
    .then(response => {
        accessToken = response.access_token;
        // Find that user's email address
        const profileUrl = `https://graph.facebook.com/v2.10/me?fields=id,name,email&access_token=${accessToken}`;
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
                fullName: _profile.name,
                token,
                email: _profile.email,
                thirdparty: {
                    provider: 'facebook',
                    token: accessToken,
                }
            })
            .save()
            .then(() => {
                res.cookie('oauth-token', token, {
                    maxAge: 365 * 24 * 60 * 60,
                    httpOnly: true,
                });
                res.redirect('/home');
            })

        }else{
            // Old user

            // Bind the data to the old account

            if(user.thirdparty.provider !== 'facebook') {
                user.thirdparty = {
                    provider: 'facebook',
                    token: accessToken,
                }
            }

            res.cookie('oauth-token', user.token, {
                maxAge: 365 * 24 * 60 * 60,
                httpOnly: true,
            });

            res.redirect('/home');

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