const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Users = require('../../schema/Users');
const randomstring = require('randomstring');
const Doodles = require('../../schema/Doodles');
const crypto = require('crypto');
const csurf = require('csurf');
const genId = require('../../src/helper/genId');

function fetchDoodle(){
    return new Promise((resolve, reject) => {
        Doodles.count()
        .then(count => {
            const random = Math.floor(Math.random() * count);
            return Doodles.findOne().skip(random);
        })
        .then(artWork => {
            resolve({
                id: artWork.id,
                image: artWork.image,
                used: artWork.used,
                author: artWork.author,
            });
        })
        .catch(error => {
            console.log(error)
            reject(error);
        })
    })
}

router.use(csurf());

router.get('/', csurf(), (req, res) => {
    fetchDoodle()
    .then(background => {
        res.render('auth/register', {
            error: false,
            message: null,
            csrfToken: req.csrfToken(),
            background,
        });
    })
});

router.post('/', csurf(), (req, res) => {
    const redirect = req.query.redirect || req.protocol + "://" + req.headers.host;

    // Check the content type
    if(req.headers['content-type'] !== 'application/x-www-form-urlencoded'){
        res.json({
            error: true,
            msg: 'Please making sure you are using application/x-www-form-urlencoded as the content type',
            code: 'invalid_http_request',
        })
        return false;
    }

    // Check the password policy

    const policy = [
        {
            query: new RegExp(/[A-Z]/g),
            msg: 'At less one uppercase latter',
        },
        {
            query: new RegExp(/[a-z]/g),
            msg: 'At less one lowercase latter',
        },
        {
            query: new RegExp(/.{8,}/g),
            msg: 'At less have 8 characters',
        }
    ]

    for(let key in policy){
        if(!req.body.password.match(policy[key].query)){

            fetchDoodle()
            .then(background => {
                res.render('auth/register', {
                    error: true,
                    message: policy[key].msg,
                    csrfToken: req.csrfToken(),
                    code: 'against_security_policy',
                    background,
                });
            })
            return false;
        }
    }

    // Check require fields
    if(typeof req.body.username == 'undefined'){
        let msg = 'Missing the username fields';
        fetchDoodle()
        .then(background => {
            res.render('auth/register', {
                error: true,
                message: msg,
                csrfToken: req.csrfToken(),
                background,
            });
        })
        return false;
    }

    if(typeof req.body.password == 'undefined'){
        let msg = 'Missing the password fields';
        fetchDoodle()
        .then(background => {
            res.render('auth/register', {
                error: true,
                message: msg,
                csrfToken: req.csrfToken(),
                background,
            });
        })
        return false;
    }

    if(typeof req.body.fullname == 'undefined'){
        let msg = 'Missing the fullname fields';
        fetchDoodle()
        .then(background => {
            res.render('auth/register', {
                error: true,
                message: msg,
                csrfToken: req.csrfToken(),
                background,
            });
        })
        return false;
    }

    if(typeof req.body.email == 'undefined'){
        let msg = 'Missing the email fields';
        fetchDoodle()
        .then(background => {
            res.render('auth/register', {
                error: true,
                message: msg,
                csrfToken: req.csrfToken(),
                background,
            });
        })
        return false;
    }

    // look for existing users
    Users.findOne({
        username: req.body.username,
    }).then(user => {
        if(user !== null){
            let msg = 'Username is already taken';
            fetchDoodle()
            .then(background => {
                res.render('auth/register', {
                    error: true,
                    message: msg,
                    csrfToken: req.csrfToken(),
                    background,
                });
            })
            return false;
        }else{
            // Hash the password
            bcrypt.genSalt(10, (error, salt) => {
                bcrypt.hash(req.body.password, salt, (error, hashedPassword) => {
                    const randomBytes = crypto.randomBytes(50);
                    let token = randomBytes.toString('hex');
                    // Making sure there no one else using the same token
                    return Users.findOne({
                        token,
                    })
                    .then(user => {
                        // Gen a new token, cuz someone else is using that token as well :/
                        token = randomBytes.toString('hex');
                        // Save the hashed password into the db     
                        const newUser = new Users({
                            id: genId(40),
                            username: req.body.username,
                            password: hashedPassword,
                            fullName: req.body.fullname,
                            email: req.body.email,
                            token,
                        });
                        newUser.save()
                        .then(user => {
                            // save the token into the cookie
                            if(req.query.no_cookie !== 'true'){
                                res.cookie('oauth-token', token, {
                                    maxAge: 365 * 24 * 60 * 60,
                                    httpOnly: true,
                                });
                            }
                            // redirect the user into the redirect url
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