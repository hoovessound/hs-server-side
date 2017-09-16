const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Users = require('../../../schema/Users');
const csurf = require('csurf');
const oAuthApps = require('../../../schema/oAuthApps');
const TempTokes = require('../../../schema/TempTokes');
const crypto = require('crypto');
const moment = require('moment');

router.use(csurf());

router.get('/', csurf(), (req, res) => {
    // render th login page
    const service = req.query.service;
    const clientId = req.query.client_id;
    if(service !== 'hs_service_login'){
        if(!clientId){
            res.render('auth/login', {
                error: null,
                message: 'Please pass in your client ID',
                csrfToken: req.csrfToken(),
            });
            return false;
        }else{

            oAuthApps.findOne({
                clientId,
            })
            .then(app =>{
                if(app === null) {
                    return false;
                }

                res.render('auth/login', {
                    error: null,
                    message: null,
                    csrfToken: req.csrfToken(),
                });

            })
            .catch(error => {
                console.log(error);
            });
        }
    }else{
        res.render('auth/login', {
            error: null,
            message: null,
            csrfToken: req.csrfToken(),
        });
    }
});

router.post('/', csurf(), (req, res) => {

    // check the oauth requirement
    const redirect = req.query.redirect;
    const service = req.query.service;
    const clientId = req.query.client_id;
    let app;

    if(!redirect){
        res.render('auth/login', {
            error: null,
            message: 'Missing the redirect query',
            csrfToken: req.csrfToken(),
        });
    }

    // Check the content type
    if(req.headers['content-type'] !== 'application/x-www-form-urlencoded'){
        res.json({
            error: true,
            msg: 'Please making sure you are using application/x-www-form-urlencoded as the content type',
            code: 'invalid_http_request',
        })
        return false;
    }

    if(service !== 'hs_service_login'){
        if(!clientId){
            res.render('auth/login', {
                error: null,
                message: 'Please pass in your client ID',
                csrfToken: req.csrfToken(),
            });
            return false;
        }
    }

    // find the username
    if(typeof req.body.email === 'undefined'){
        let msg = 'Please enter your email address';
        res.render('auth/login', {
            error: true,
            message: msg,
            csrfToken: req.csrfToken(),
        });
        return false;
    }

    if(typeof req.body.password === 'undefined'){
        let msg = 'Please enter the password';
        res.render('auth/login', {
            error: true,
            message: msg,
            code: 'missing_require_fields',
            csrfToken: req.csrfToken(),
        });

        return false;
    }

    oAuthApps.findOne({
        clientId,
    })
    .then(dbApp => {
        if(service !== 'hs_service_login') {
            if (dbApp === null) {
                res.render('auth/login', {
                    error: null,
                    message: 'Bad client ID',
                    csrfToken: req.csrfToken(),
                });
                return false;
            }
            app = dbApp;
        }
        return Users.findOne({
            email: req.body.email,
        })
        .then(user => {
            if(user === null){
                let msg = 'Incorrect email or password';
                res.render('auth/login', {
                    error: true,
                    message: msg,
                    csrfToken: req.csrfToken(),
                    appName: app.name,
                });
                return false;
            }else{
                // Check for the password
                return bcrypt.compare(req.body.password, user.password).then(same => {
                    if(same){
                        const rawQuery = require('url').parse(req.url).query;

                        if(service === 'hs_service_login'){
                            res.cookie('oauth-token', user.token, {
                                maxAge: 365 * 24 * 60 * 60,
                                httpOnly: true,
                            });
                            res.redirect(redirect);
                        }else{
                            res.render('auth/permission', {
                                appName: app.name,
                                csrfToken: req.csrfToken(),
                                error: null,
                                message: null,
                                rawQuery,
                                uid: user._id,
                            });
                        }
                    }else{
                        // Incorrect username or password
                        let msg = 'Incorrect email or password';
                        res.render('auth/login', {
                            error: true,
                            message: msg,
                            csrfToken: req.csrfToken(),
                            appName: app.name,
                        });
                    }
                });
            }
        })
    })
    .catch(error => {
        console.log(error);
    });
});

router.post('/permission', csurf(), (req, res) => {
    const clientId = req.query.client_id;
    let app;
    const redirect = req.query.redirect;
    const uid = req.body.uid;

    if(!uid){
        res.render('auth/login', {
            error: null,
            message: 'Missing UID',
            csrfToken: req.csrfToken(),
        });
        return false;
    }

    return Users.findOne({
        _id: uid,
    })
    .then(user => {
        return oAuthApps.findOne({
            clientId,
        })
    })
    .then(app => {
        if(app === null) {
            res.render('auth/login', {
                error: null,
                message: 'Bad client ID',
                csrfToken: req.csrfToken(),
            });
            return false;
        }

        if(req.body.allow){
            // generate the token

            const tempToken = crypto.randomBytes(50).toString('hex');

            // Save the temporary token to the DB
            const currentTime = moment()._d;
            const endTime = moment(currentTime).add(5, 'minutes');
            return new TempTokes({
                token: tempToken,
                timestamp: {
                    start: currentTime,
                    end: endTime,
                },
                author: {
                    app: app._id,
                    user: uid,
                },
            })
            .save()
            .then(() => {
                res.redirect(`${redirect}?success=true&token=${tempToken}&end_time=${endTime}`);
            })
        }else{
            res.redirect(`${redirect}?success=false&reason=User denied access`);
        }

    })
    .catch(error => {
        if(error.message.includes('Cast to ObjectId failed for value')){
            res.render('auth/login', {
                error: null,
                message: 'Bad UID',
                csrfToken: req.csrfToken(),
            });
            return false;
        }else{
            console.log(error)
        }
    })
});

module.exports = router;