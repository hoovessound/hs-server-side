const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Users = require('../../schema/Users');
const Changepassword = require('../../schema/Changepassword');
const nodemailer = require('nodemailer');
const randomstring = require('randomstring');
const mg = require('nodemailer-mailgun-transport');
const authFile = require('../../src/db');

router.get('/', (req, res) => {
    const token = req.query.token;
    // rende th login page
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
                                                user.token = randomstring.generate(255);
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
        // Check the content type
        if(req.headers['content-type'] !== 'application/x-www-form-urlencoded'){
            res.json({
                error: true,
                msg: 'Please making sure you are using application/x-www-form-urlencoded as the content type',
                code: 'invalid_http_request',
            })
            return false;
        }

        if(typeof req.body.email === 'undefined'){
            if(response === 'json'){
                res.json({
                    error: true,
                    message: 'Please enter the email',
                    code: 'missing_require_fields',
                });
                return false;
            }else{
                res.render('auth/login', {
                    error: true,
                    message: 'Please enter the email',
                    code: 'missing_require_fields',
                });
                return false;
            }
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
                        });
                        return false;
                    }
                }else{
                    const token = randomstring.generate(255);
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
                }
            })
            .catch(error => {
                console.log(error);
            });
    }
});

module.exports = router;