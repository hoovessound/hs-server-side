const express = require('express');
const router = express.Router();
const Users = require('../../../schema/Users');
const oAuthApps = require('../../../schema/oAuthApps');
const csurf = require('csurf');
const crypto = require('crypto');
const rp = require('request-promise');
const mg = require('nodemailer-mailgun-transport');
const authFile = require('../../../src/index');
const nodemailer = require('nodemailer');
const moment = require('moment');

router.use(csurf());

router.get('/', csurf(), (req, res) => {
    const full_address = req.protocol + "://" + req.headers.host;
    const token = req.cookies['oauth-token'];
    if(!req.cookies['oauth-token']){
        res.end('Access denied');
    }else{

        Users.findOne({
            token: token,
        }).then(user => {
            if(user === null){
                res.end('Access denied');
                return false;
            }else{
                return oAuthApps.find({
                    author: user.id,
                })
                .then(apps => {
                    res.render('oAuthApp', {
                        csrfToken: req.csrfToken(),
                        query: req.query,
                        apps,
                    });
                })
            }
        }).catch(error => {
            console.log(error)
        })
    }
});

router.post('/', csurf(), (req, res) => {
    const full_address = req.protocol + "://" + req.headers.host;
    const token = req.cookies['oauth-token'];
    if(!token){
        res.end('Access denied');
    }else{
        return Users.findOne({
            token,
        }).then(user => {
            if(user === null){
                res.end('Access denied');
                return false;
            }else{
                const name = req.body.name;
                const description = req.body.description;
                let callbackUrl = req.body.callbackurl;
                if(!name){
                    res.redirect('/error=Please enter the app name');
                    return false;
                }

                if(!callbackUrl){
                    res.redirect('/?error=Please enter the white domain');
                    return false;
                }

                // Success

                callbackUrl = callbackUrl.split('\n');

                return new oAuthApps({
                    author: user.id,
                    createDate: moment()._d,
                    name,
                    clientId: crypto.randomBytes(50).toString('hex'),
                    clientSecret: crypto.randomBytes(70).toString('hex'),
                    description,
                    callbackUrl,
                })
                .save()
                .then(() => {

                    res.redirect('/?success=true');
                    // Send an email to notify the user an API key is created under him/her name
                    const auth = {
                        auth: {
                            api_key: authFile.mailgun.key,
                            domain: authFile.mailgun.domain,
                        }
                    };

                    // const nodemailerMailgun = nodemailer.createTransport(mg(auth));
                    // return nodemailerMailgun.sendMail({
                    //     from: 'HoovesSound No Reply <no-reply@sandbox1cae24800f86489d881d7c06630b0a14.mailgun.org>',
                    //     to: user.email,
                    //     subject: 'A New API Key Is Created On HoovesSound Under Your Name',
                    //     html: `Just want to let you know, there a new set of API key called ${name} is created under your name, if that wasn't you, please remove the app and change your password right a way.`,
                    // })
                })

            }
        })
    }
});

router.post('/update', csurf(), (req, res) => {
    const full_address = req.protocol + "://" + req.headers.host;
    const token = req.cookies['oauth-token'];
    if(!token){
        res.end('Access denied');
    }else{
        return Users.findOne({
            token,
        }).then(user => {
            if(user === null){
                res.end('Access denied');
                return false;
            }else{
                return oAuthApps.findOne({
                    clientId: req.body._clientid,
                })
            }
        })
        .then(app => {
            if(!app) {
                res.redirect('/?error=Something when wrong, please try again');
                return false;
            }else{
                app.name = req.body.appName;
                app.callbackUrl = req.body.callbackurl.split('\n');
                return oAuthApps.update({
                    _id: app._id,
                },app);
            }
        })
        .then(() => {
            res.redirect('/?success=true');
        })
    }
});

module.exports = router;