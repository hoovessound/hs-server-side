const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Users = require('../../schema/Users');

router.get('/', (req, res) => {
    // rende th login page
    res.render('auth/login', {
        error: null,
        message: null
    });
});

router.post('/', (req, res) => {

    // check the oauth requirement
    const redirect = req.query.redirect || req.protocol + "://" + req.headers.host;
    const response = req.query.response;
    const service = req.query.service;

    // Check the content type
    if(req.headers['content-type'] !== 'application/x-www-form-urlencoded'){
        res.json({
            error: true,
            msg: 'Please making sure you are using application/x-www-form-urlencoded as the content type',
            code: 'invalid_http_request',
        })
        return false;
    }

    // find the username
    if(typeof req.body.username === 'undefined'){
        let msg = 'Please enter the username';
        if(response === 'json'){
            res.json({
                error: true,
                message: msg,
                code: 'unauthorized_action',
            });
            return false;
        }else{
            res.render('auth/login', {
                error: true,
                message: msg,
            });
            return false;
        }
    }

    if(typeof req.body.password === 'undefined'){
        let msg = 'Please enter the password';
        if(response === 'json'){
            res.json({
                error: true,
                message: msg,
                code: 'missing_require_fields',
            });
            return false;
        }else{
            res.render('auth/login', {
                error: true,
                message: msg,
                code: 'missing_require_fields',
            });
            return false;
        }
    }


    Users.findOne({
        username: req.body.username,
    })
    .then(user => {
        if(user === null){
            let msg = 'Incorrect username or password';
            if(response === 'json'){
                res.json({
                    error: true,
                    message: msg,
                    code: 'unauthorized_action',
                });
                return false;
            }else{
                res.render('auth/login', {
                    error: true,
                    message: msg,
                    code: 'unauthorized_action',
                });
                return false;
            }
        }else{
            // Check for the password
            return bcrypt.compare(req.body.password, user.password).then(same => {
                if(same){
                    // generate the token
                    const token = user.token;
                    // save the token into the cookie
                    res.cookie('oauth-token', token, {
                        maxAge: 365 * 24 * 60 * 60,
                        httpOnly: true,
                    });
                    // save the token into the session
                    req.session.token = token;

                    if(response === 'json') {
                        // response with a JSON format
                        res.json({
                           token,
                        });
                    }else{
                        // redirect the user into the redirect url

                        if(service === 'hs_service_login') {
                            res.redirect(redirect);
                        }else{
                            res.redirect(`${redirect}?success=true&token=${token}`);
                        }

                    }

                }else{
                    // Incorrect username or password
                    let msg = 'Incorrect username or password';
                    if(response === 'json'){
                        res.json({
                            error: true,
                            message: msg,
                            code: 'unauthorized_action',
                        });
                        return false;
                    }else{
                        res.render('auth/login', {
                            error: true,
                            message: msg,
                        });
                    }
                }
            });
        }
    })
    .catch(error => {
        console.log(error);
    })
});

module.exports = router;