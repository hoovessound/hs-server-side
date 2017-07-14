const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Users = require('../../schema/Users');
const randomstring = require('randomstring');

router.get('/', (req, res) => {
    res.render('auth/register', {
        error: false,
        message: null,
    });
});

router.post('/', (req, res) => {
    const redirect = req.query.redirect || req.protocol + "://" + req.headers.host;
    // Check require fields
    if(typeof req.body.username == 'undefined'){
        res.render('auth/register', {
            error: true,
            message: 'Missing the username fields',
        });
        return false;
    }

    if(typeof req.body.fullname == 'undefined'){
        res.render('auth/register', {
            error: true,
            message: 'Missing the password fields',
        });
        return false;
    }

    if(typeof req.body.fullname == 'undefined'){
        res.render('auth/register', {
            error: true,
            message: 'Missing the full name fields',
        });
        return false;
    }

    if(typeof req.body.email == 'undefined'){
        res.render('auth/register', {
            error: true,
            message: 'Missing the email fields',
        });
        return false;
    }

    // look for existing users
    Users.findOne({
        username: req.body.username,
    }).then(user => {
        if(user !== null){
            res.render('auth/register', {
                error: true,
                message: 'Username is already taken'
            });
            return false;
        }else{
            // Hash the password
            bcrypt.genSalt(10, (error, salt) => {
                bcrypt.hash(req.body.password, salt, (error, hashedPassword) => {
                    let token = randomstring.generate(255);
                    // Making sure there no one else using the same token
                    return Users.findOne({
                        token,
                    })
                    .then(user => {
                        // Gen a new token, cuz someone else is using that token as well :/
                        token = randomstring.generate(255);
                        // Save the hashed password into the db     
                        const newUser = new Users({
                            username: req.body.username,
                            password: hashedPassword,
                            fullName: req.body.fullname,
                            email: req.body.email,
                            token,
                        });
                        newUser.save()
                        .then(user => {
                            // save the token into the cookie
                            res.cookie('oauth-token', user.token, {
                                maxAge: 365 * 24 * 60 * 60,
                                httpOnly: true,
                            });
                            res.redirect(`${redirect}?success=true&token=${token}`);
                        })
                        .catch(error => {
                            console.log(error);
                        })
                    })
                });
            });
        }
    })
    .catch(error => {
        console.log(error);
    });
});

module.exports = router;