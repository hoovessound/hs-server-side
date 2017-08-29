const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Users = require('../../schema/Users');
const Changepassword = require('../../schema/Changepassword');
const nodemailer = require('nodemailer');
const randomstring = require('randomstring');
const mg = require('nodemailer-mailgun-transport');
const authFile = require('../../src/index');
const rp = require('request-promise');
const crypto = require('crypto');

router.get('/', (req, res) => {
    const token = req.query.token;
    // render the change password page
    res.render('auth/changepassword', {
        error: null,
        message: null,
        token,
    });
});

router.post('/', (req, res) => {
    const response = req.query.response;
    const full_address = req.protocol + "://" + req.headers.host;
    const token = req.query.token;

    if(token){
        const newPassword = req.body.password;
        Changepassword.findOne({
            token,
        })
        .then(job => {
            if(job === null){
                res.render('auth/changepassword', {
                    error: true,
                    message: 'Can not found your token',
                    token,
                });
                return false;
            }else{
                // Check if that token is use before
                if(job.updated){
                    res.render('auth/changepassword', {
                        error: true,
                        message: 'Token used before',
                        token,
                    });
                    return false;
                }else{
                    // Date the database
                    job.updated = true;
                    job.changeDate = new Date();
                    return Changepassword.update({
                        token,
                    }, job)
                    .then(() => {
                        return Users.findOne({
                            _id: job.user,
                        })
                        .then(user => {
                            this.user = user;
                            // Hash the password
                            bcrypt.genSalt(10, (error, salt) => {
                                bcrypt.hash(req.body.password, salt, (error, hashedPassword) => {
                                    user.password = hashedPassword;
                                    // re-new the user's token
                                    const randomBytes = crypto.randomBytes(50);
                                    user.token = randomBytes.toString('hex');
                                    return Users.update({
                                        _id: this.user._id,
                                    }, user)
                                    .then(() => {
                                        res.redirect('/api/auth/login?changepassword=true');
                                    })
                                    .catch(error => {
                                        console.log(error);
                                    })
                                })
                            });
                        })
                    })
                }
            }
        })
        .catch(error => {
            console.log(error);
        });
    }else{

        if(typeof req.body.email === 'undefined'){
            res.render('auth/login', {
                error: true,
                message: 'Please enter the email',
                code: 'missing_require_fields',
                token,
            });
            return false;
        }

        Users.findOne({
            email: req.body.email,
        })
        .then(user => {
            if(user === null){
                if(response === 'json'){
                    res.json({
                        error: true,
                        message: 'Incorrect email',
                        code: 'unauthorized_action',
                    });
                    return false;
                }else{
                    res.render('auth/changepassword', {
                        error: true,
                        message: 'Incorrect email',
                        code: 'unauthorized_action',
                        token,
                    });
                    return false;
                }
            }else{
                const token = randomstring.generate(255);
                const grecaptchaResponse = req.body['g-recaptcha-response'];
                const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                if(grecaptchaResponse){
                    return rp({
                        url: 'https://www.google.com/recaptcha/api/siteverify',
                        method: 'post',
                        form: {
                            secret: process.env.RECAPTCHA,
                            response: grecaptchaResponse,
                            remoteip: ip,
                        }
                    })
                    .then(response => {
                        response = JSON.parse(response);
                        if(response.success === true){
                            // Send an email to the that user
                            const auth = {
                                auth: {
                                    api_key: authFile.mailgun.key,
                                    domain: authFile.mailgun.domain,
                                }
                            }

                            // Save the job to the database first
                            const newJob = new Changepassword({
                                user: user._id,
                                token,
                                createDate: new Date(),
                                changeDate: new Date(),
                            })

                            return newJob.save()
                            .then(job => {
                                const nodemailerMailgun = nodemailer.createTransport(mg(auth));
                                return nodemailerMailgun.sendMail({
                                    from: 'HoovesSound No Reply <no-reply@sandbox1cae24800f86489d881d7c06630b0a14.mailgun.org>',
                                    to: user.email,
                                    subject: 'Change Your Password',
                                    html: `Click to change your password: ${full_address}/api/auth/changepassword?token=${token}`,
                                })
                                .then(info => {
                                    res.end(`We already sent your an email to ${user.email}, please check that email and continue to changing your password.`);
                                })
                            })
                        }else{
                            res.render('auth/changepassword', {
                                error: true,
                                message: 'Are you a bot',
                                code: 'not_a_human',
                                token: null,
                            });
                            return false;
                        }
                    })
                }
            }
        })
        .catch(error => {
            console.log(error);
        });
    }
});

module.exports = router;