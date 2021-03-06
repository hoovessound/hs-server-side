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
const jwt = require('jsonwebtoken');

const Doodles = require('../../../schema/Doodles');

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

function fetchDoodle(){
    return new Promise((resolve, reject) => {
        Doodles.count()
        .then(count => {
            const random = Math.floor(Math.random() * count);
            return Doodles.findOne().skip(random);
        })
        .then(artWork => {
            Users.findOne({
                id: artWork.author,
            })
            .then(user => {
                resolve({
                    id: artWork.id,
                    image: artWork.image,
                    used: artWork.used,
                    author: {
                        link: `https://hoovessound.ml/@${user.username}`,
                        name: user.fullName,
                    },
                });
            })
            .catch(error => {
                console.log(error);
            })
        })
        .catch(error => {
            reject(error);
        })
    })
}

router.get('/', csurf(), (req, res) => {
    // render th login page
    const service = req.query.service;
    const redirect = req.query.redirect;
    const clientId = req.query.client_id;
    const oAuthToken = req.cookies['jwt_token'];
    const rawQuery = url.parse(req.url).query;
    req.session.rawQuery = rawQuery;
    let _app;

    if(service){
        fetchDoodle()
        .then(background => {
            res.render('auth/login', {
                error: null,
                message: null,
                csrfToken: req.csrfToken(),
                oAuth: req.query.client_id ? true : false,
                background,
            });
        });
    }else{
        // Error checking
        if(!clientId){
            fetchDoodle()
            .then(background => {
                res.render('auth/login', {
                    error: true,
                    message: 'Missing the redirect Client ID',
                    csrfToken: req.csrfToken(),
                    background,
                });
            });
            return false;
        }

        if(!redirect){
            fetchDoodle()
            .then(background => {
                res.render('auth/login', {
                    error: true,
                    message: 'Missing the redirect url',
                    csrfToken: req.csrfToken(),
                    background,
                });
            });
            return false;
        }


        // Checks if the JWT token exits
        if(!oAuthToken){
            // No JWT Token
            fetchDoodle()
            .then(background => {
                res.render('auth/login', {
                    error: null,
                    message: null,
                    csrfToken: req.csrfToken(),
                    oAuth: req.query.client_id ? true : false,
                    background,
                });
            });
        }else{

            // Find the oAuthApp
            oAuthApps.findOne({
                clientId,
            })
            .then(app => {
                if(!app){
                    fetchDoodle()
                    .then(background => {
                        res.render('auth/login', {
                            error: true,
                            message: 'Incorrect Client ID',
                            csrfToken: req.csrfToken(),
                            background,
                        });
                    });
                    return false;
                }else{
                    const deCodeedObject = jwt.verify(oAuthToken, process.env.JWTTOKEN);
                    Users.findOne({
                        id: deCodeedObject.id,
                    })
                    .then(user => {
                        if(!user){
                            // Remove the jwt_token
                            req.cookie.clearColor('jwt_token');
                            // And re-login
                            fetchDoodle()
                            .then(background => {
                                res.render('auth/login', {
                                    error: null,
                                    message: null,
                                    csrfToken: req.csrfToken(),
                                    oAuth: req.query.client_id ? true : false,
                                    background,
                                });
                            });
                        }else{
                            // User exits
                            fetchDoodle()
                            .then(background => {
                                console.log(background)
                                res.render('auth/permission', {
                                    appName: app.name,
                                    csrfToken: req.csrfToken(),
                                    error: null,
                                    message: null,
                                    rawQuery,
                                    uid: user.id,
                                    user,
                                    scope: req.scopeInAction.parse,
                                    background,
                                });
                            });
                        }
                    })
                    .catch(error => {
                        res.status(500);
                        res.end('Opps, something when wrong...');
                        console.log(error);
                    });
                }
            })
            .catch(error => {
                console.log(error);
            });
        }

    }
});

router.post('/', csurf(), (req, res) => {

    // check the oauth requirement
    const redirect = req.query.redirect;
    const service = req.query.service;
    const clientId = req.query.client_id;
    let app;

    if(!redirect){
        fetchDoodle()
        .then(background => {
            res.render('auth/login', {
                error: true,
                message: 'Missing the redirect url',
                csrfToken: req.csrfToken(),
                background,
            });
        })
        .catch(error => {
            console.log(error);
        })
    }

    // Check the content type
    if(req.headers['content-type'] !== 'application/x-www-form-urlencoded'){
        res.json({
            error: true,
            msg: 'Please making sure you are using application/x-www-form-urlencoded as the content type',
            code: 'invalid_http_request',
        });
        return false;
    }

    if(service !== 'hs_service_login'){
        if(!clientId){
            fetchDoodle()
            .then(background => {
                res.render('auth/login', {
                    error: true,
                    message: 'Please pass in your client ID',
                    csrfToken: req.csrfToken(),
                    background,
                });
            });
            return false;
        }
    }

    // find the username
    if(typeof req.body.email === 'undefined'){
        let msg = 'Please enter your email address';
        fetchDoodle()
        .then(background => {
            res.render('auth/login', {
                error: true,
                message: msg,
                csrfToken: req.csrfToken(),
                background,
            });
        });
        return false;
    }

    if(typeof req.body.password === 'undefined'){
        let msg = 'Please enter the password';
        fetchDoodle()
        .then(background => {
            res.render('auth/login', {
                error: true,
                message: msg,
                code: 'missing_require_fields',
                csrfToken: req.csrfToken(),
                background,
            });
        });

        return false;
    }

    oAuthApps.findOne({
        clientId,
    })
    .then(dbApp => {
        if(service !== 'hs_service_login') {
            if (dbApp === null) {
                fetchDoodle()
                .then(background => {
                    res.render('auth/login', {
                        error: true,
                        message: 'Bad client ID',
                        csrfToken: req.csrfToken(),
                        background,
                    });
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
                fetchDoodle()
                .then(background => {
                    res.render('auth/login', {
                        error: null,
                        message: null,
                        pwdError: msg,
                        csrfToken: req.csrfToken(),
                        background,
                    });
                });
                return false;
            }else{
                // Check for the password
                return bcrypt.compare(req.body.password, user.password).then(same => {
                    if(same){
                        const rawQuery = url.parse(req.url).query;
                        const domain = parseDomain(req.hostname);
                        const jwtToken = jwt.sign({
                            id: user.id,
                            username: user.username,
                            signDate: Date.now(),
                        }, process.env.JWTTOKEN, {
                            expiresIn: 3600 * 1000 * 24 * 365 * 10,
                        });
                        res.cookie('jwt_token', jwtToken, {
                            maxAge: 3600 * 1000 * 24 * 365 * 10,
                            httpOnly: false,
                            // cors all HS subdomains
                            domain: `.${domain.domain}.${domain.tld}`,
                        });

                        if(service === 'hs_service_login'){
                            res.redirect(redirect);
                        }else{
                            fetchDoodle()
                            .then(background => {
                                res.render('auth/permission', {
                                    appName: app.name,
                                    csrfToken: req.csrfToken(),
                                    error: null,
                                    message: null,
                                    rawQuery,
                                    uid: user.id,
                                    user,
                                    scope: req.scopeInAction.parse,
                                    background,
                                });
                            });
                        }
                    }else{
                        // Incorrect username or password
                        let msg = 'Incorrect email or password';
                        fetchDoodle()
                        .then(background => {
                            res.render('auth/login', {
                                error: null,
                                message: null,
                                pwdError: msg,
                                csrfToken: req.csrfToken(),
                                background,
                            });
                        })
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
        fetchDoodle()
        .then(background => {
            res.render('auth/login', {
                error: true,
                message: 'Missing UID',
                csrfToken: req.csrfToken(),
                background,
            });
        })
        return false;
    }

    return Users.findOne({
        id: uid,
    })
    .then(user => {

        if(!user){
            fetchDoodle()
            .then(background => {
                res.render('auth/login', {
                    error: true,
                    message: 'Bad UID',
                    csrfToken: req.csrfToken(),
                    background,
                });
            })
            return false;
        }

        return oAuthApps.findOne({
            clientId,
        })
    })
    .then(app => {
        if(app === null) {
            fetchDoodle()
            .then(background => {
                res.render('auth/login', {
                    error: true,
                    message: 'Bad client ID',
                    csrfToken: req.csrfToken(),
                    background,
                });
            })
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
                    app: app.clientId,
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
            fetchDoodle()
            .then(background => {
                res.render('auth/login', {
                    error: true,
                    message: 'Bad UID',
                    csrfToken: req.csrfToken(),
                    background,
                });
            })
            return false;
        }else{
            console.log(error)
        }
    })
});

module.exports = router;
