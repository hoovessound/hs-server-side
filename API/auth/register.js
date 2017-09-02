const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Users = require('../../schema/Users');
const randomstring = require('randomstring');
const crypto = require('crypto');
const csurf = require('csurf');

router.use(csurf());

router.get('/', csurf(), (req, res) => {
    const sudo = req.query.sudo;
    if(!sudo){
        res.send('<h1>You will be <a href="https://docs.google.com/forms/d/e/1FAIpQLScPxrOxzTVM2wc2NJMZ2tBOpnOhCSHzpU6QzxutE9Su_wXofA/viewform?usp=sf_link">Redirect</a> to sign up as a open beta tester in 5 seconds later</h1><script>setTimeout(function(){window.open("https://docs.google.com/forms/d/e/1FAIpQLScPxrOxzTVM2wc2NJMZ2tBOpnOhCSHzpU6QzxutE9Su_wXofA/viewform?usp=sf_link", "_self")}, 5000)</script>')
        return false;
    }
    res.render('auth/register', {
        error: false,
        message: null,
        csrfToken: req.csrfToken(),
    });
});

router.post('/', csurf(), (req, res) => {
    const sudo = req.query.sudo;
    if(!sudo){
        res.json({
            error: true,
            msg: 'Please sign up as a open beta tester at https://docs.google.com/forms/d/e/1FAIpQLScPxrOxzTVM2wc2NJMZ2tBOpnOhCSHzpU6QzxutE9Su_wXofA/viewform?usp=sf_link',
            code: 'service_lock_down',
            url: 'https://docs.google.com/forms/d/e/1FAIpQLScPxrOxzTVM2wc2NJMZ2tBOpnOhCSHzpU6QzxutE9Su_wXofA/viewform?usp=sf_link',
        })
        return false;
    }
    const redirect = req.query.redirect || req.protocol + "://" + req.headers.host;
    const response = req.query.response;

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

            if(response === 'json'){
                res.json({
                    error: true,
                    msg: policy[key].msg,
                    code: 'against_security_policy',
                });
                return false;
            }else{
                res.render('auth/register', {
                    error: true,
                    message: policy[key].msg,
                    code: 'against_security_policy',
                });
                return false;
            }
        }
    }

    // Check require fields
    if(typeof req.body.username == 'undefined'){
        let msg = 'Missing the username fields';
        if(response === 'json'){
            res.json({
                error: true,
                msg: msg,
                code: 'missing_require_fields',
            });
            return false;
        }else{
            res.render('auth/register', {
                error: true,
                message: msg,
            });
            return false;
        }
    }

    if(typeof req.body.password == 'undefined'){
        let msg = 'Missing the password fields';
        if(response === 'json'){
            res.json({
                error: true,
                msg: msg,
                code: 'missing_require_fields',
            });
            return false;
        }else{
            res.render('auth/register', {
                error: true,
                message: msg,
            });
            return false;
        }
    }

    if(typeof req.body.fullname == 'undefined'){
        let msg = 'Missing the fullname fields';
        if(response === 'json'){
            res.json({
                error: true,
                msg: msg,
                code: 'missing_require_fields',
            });
            return false;
        }else{
            res.render('auth/register', {
                error: true,
                message: msg,
            });
            return false;
        }
    }

    if(typeof req.body.email == 'undefined'){
        let msg = 'Missing the email fields';
        if(response === 'json'){
            res.json({
                error: true,
                msg: msg,
                code: 'missing_require_fields',
            });
            return false;
        }else{
            res.render('auth/register', {
                error: true,
                message: msg,
            });
            return false;
        }
    }

    // look for existing users
    Users.findOne({
        username: req.body.username,
    }).then(user => {
        if(user !== null){
            let msg = 'Username is already taken';
            if(response === 'json'){
                res.json({
                    error: true,
                    msg: msg,
                    code: 'unauthorized_action',
                });
                return false;
            }else{
                res.render('auth/register', {
                    error: true,
                    message: msg,
                });
                return false;
            }
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
                            if(response === 'json') {
                                // response with a JSON format
                                res.json({
                                    token,
                                });
                            }else{
                                // redirect the user into the redirect url
                                res.redirect(`${redirect}?success=true&token=${token}`);
                            }
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