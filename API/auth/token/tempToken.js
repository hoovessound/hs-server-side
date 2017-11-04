const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Users = require('../../../schema/Users');
const csurf = require('csurf');
const oAuthApps = require('../../../schema/oAuthApps');
const TempTokes = require('../../../schema/TempTokes');
const crypto = require('crypto');
const moment = require('moment');
const url = require('url');
const parseDomain = require('parse-domain');

router.use(csurf());

// Parse the scope query string
router.use((req, res, next) => {
    const scope = req.query.scope;
    let scopeInAction = [];

    if(scope){
        const scopesArray = scope.split(',');
        const scopes = {
            'post_comment': 'Post comments under your name',
            'fave_track': 'Favourite or Un-favourite tracks',
            'upload_track': 'Upload tracks under your name',
            'private_track': 'Be able to view and edit your own private track',
            'edit_track': 'Be able to edit your own track information',
        }

        for(let key in scopes) {
            const description = scopes[key];
            scopesArray.forEach(id => {
                if(id === key){
                    scopeInAction.push({
                        name: key,
                        description,
                    });
                }
            })
        }

        req.scopeInAction = {
            parse: scopeInAction,
            raw: scopesArray,
        }
    }else{
        req.scopeInAction = {
            parse: [],
            raw: 'basic_user_info'
        }
    }
    next();
});

router.use((req, res, next) => {
    // Check if the redirect url is match the DB one
    const service = req.query.service;
    const redirect = req.query.redirect;
    const clientId = req.query.client_id;
    if(!service) {
        return oAuthApps.findOne({
            clientId,
        })
        .then(app => {
            if(app) {

                let find = false;
                app.callbackUrl.forEach(allowUrl => {
                    const clientHost = url.parse(redirect).host;
                    if(clientHost === allowUrl || allowUrl === '*'){
                        find = true;
                    }
                });
                if(find) {
                    req.hsAuth ={
                        app,
                    }
                    next();
                }else{
                    res.render('auth/login', {
                        error: true,
                        message: 'Your redirect url is not white listed yet',
                        csrfToken: req.csrfToken(),
                    });
                    return false;
                }

            }else{
                res.render('auth/login', {
                    error: true,
                    message: 'Bad client ID',
                    csrfToken: req.csrfToken(),
                });
                return false;
            }
        })
    }else{
        next();
    }
})

router.get('/', csurf(), (req, res) => {
    // render th login page
    const service = req.query.service;
    const redirect = req.query.redirect;
    const clientId = req.query.client_id;
    const oAuthToken = req.cookies['oauth-token'];
    const rawQuery = url.parse(req.url).query;
    req.session.rawQuery = rawQuery;

    if(service){
        res.render('auth/login', {
            error: null,
            message: null,
            csrfToken: req.csrfToken(),
            oAuth: req.query.client_id ? true : false,
        });
    }else{
        Users.findOne({
            token: oAuthToken,
        })
        .then(user => {
            if(user){
                // Have OAuth tokekn
    
                // Logined user
    
                // Fastforward to permission page
    
                const rawQuery = url.parse(req.url).query;
                res.render('auth/permission', {
                    appName: req.hsAuth.app.name,
                    csrfToken: req.csrfToken(),
                    error: null,
                    message: null,
                    rawQuery,
                    uid: user._id,
                    user,
                    scope: req.scopeInAction.parse,
                });
    
            }else{
    
                // Didn't have oAuth token

                if(!clientId){
                    res.render('auth/login', {
                        error: true,
                        message: 'Please pass in your client ID',
                        csrfToken: req.csrfToken(),
                    });
                    return false;
                }else{
        
                    if(!redirect){
                        res.render('auth/login', {
                            error: true,
                            message: 'Missing the redirect url',
                            csrfToken: req.csrfToken(),
                        });
                    }
        
                    oAuthApps.findOne({
                        clientId,
                    })
                    .then(app =>{
                        if(app === null) {
                            res.render('auth/login', {
                                error: true,
                                message: 'Bad client ID',
                                csrfToken: req.csrfToken(),
                            });
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
            }
        })
        .catch(error => {
            console.log(error);
        })
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
            error: true,
            message: 'Missing the redirect url',
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
                error: true,
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
                    error: true,
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
                    error: null,
                    message: null,
                    pwdError: msg,
                    csrfToken: req.csrfToken(),
                });
                return false;
            }else{
                // Check for the password
                return bcrypt.compare(req.body.password, user.password).then(same => {
                    if(same){
                        const rawQuery = url.parse(req.url).query;
                        const domain = parseDomain(req.hostname);
                        res.cookie('oauth-token', user.token, {
                            maxAge: 3600 * 1000 * 24 * 365 * 10,
                            httpOnly: false,
                            // cors all HS subdomains
                            domain: `.${domain.domain}.${domain.tld}`,
                        });

                        if(service === 'hs_service_login'){
                            res.redirect(redirect);
                        }else{
                            res.render('auth/permission', {
                                appName: app.name,
                                csrfToken: req.csrfToken(),
                                error: null,
                                message: null,
                                rawQuery,
                                uid: user._id,
                                user,
                                scope: req.scopeInAction.parse,
                            });
                        }
                    }else{
                        // Incorrect username or password
                        let msg = 'Incorrect email or password';
                        res.render('auth/login', {
                            error: null,
                            message: null,
                            pwdError: msg,
                            csrfToken: req.csrfToken(),
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
    const redirect = req.query.redirect;
    const uid = req.body.uid;

    if(!uid){
        res.render('auth/login', {
            error: true,
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
                error: true,
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
                permission: req.scopeInAction.raw,
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
                error: true,
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
