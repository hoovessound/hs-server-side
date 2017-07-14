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
    // find the username
    if(typeof req.body.username === 'undefined'){
        res.render('auth/login', {
            error: true,
            message: 'Please enter the username'
        });
        return false;
    }

    if(typeof req.body.password === 'undefined'){
        res.render('auth/login', {
            error: true,
            message: 'Please enter the password'
        });
        return false;
    }


    Users.findOne({
        username: req.body.username,
    })
    .then(user => {
        if(user === null){
            res.render('auth/login', {
                error: true,
                message: 'Incorrect username or password',
            });
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
                    // redirect the user into the redirect url
                    res.redirect(`${redirect}?success=true&token=${token}`);
                }else{
                    // Incorrect username or password
                    res.render('auth/login', {
                        error: true,
                        message: 'Incorrect username or password',
                    });
                }
            });
        }
    })
    .catch(error => {
        console.log(error);
    })
});

module.exports = router;