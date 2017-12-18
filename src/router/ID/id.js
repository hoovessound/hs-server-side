const express = require('express');
const router = express.Router();
const oAuthApps = require('../../../schema/oAuthApps');
const TempTokes = require('../../../schema/TempTokes');
const Doodles = require('../../../schema/Doodles');
const url = require('url');
const csurf = require('csurf');
router.use(csurf());
router.use('/register', require('../../../API/auth/register'));
router.use('/changepassword', require('../../../API/auth/changepassword'));

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
                    fetchDoodle()
                    .then(background => {
                        res.render('auth/login', {
                            error: true,
                            message: 'Your redirect url is not white listed yet',
                            csrfToken: req.csrfToken(),
                            background,
                        });
                    })
                    .catch(error => {
                        console.log(error);
                    })
                    return false;
                }

            }else{
                fetchDoodle()
                .then(background => {
                    res.render('auth/login', {
                        error: true,
                        message: 'Bad client ID',
                        csrfToken: req.csrfToken(),
                        background,
                    });
                })
                .catch(error => {
                    console.log(error);
                })
                return false;
            }
        })
        .catch(error => {
            console.log(error);
        })
    }else{
        next();
    }
})

router.use('/', require('../../../API/auth/token/tempToken'));
router.use('/login', require('../../../API/auth/token/tempToken'));

module.exports = router;