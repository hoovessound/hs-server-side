const express = require('express');
const router = express.Router();
const fullurl = require('fullurl');
const Users = require('../../../schema/Users');

router.get('/', (req, res) => {
    const full_address = req.protocol + "://" + req.headers.host;
    const offset = req.query.offset || 0;
    const token = req.cookies['oauth-token'];
    if(!req.cookies['oauth-token']){
        res.redirect('/api/auth/login?redirect=' + fullurl(req));
    }else{

        Users.findOne({
            token: token,
        }).then(user => {
            if(user === null){
                res.redirect('/api/auth/login?redirect=' + fullurl(req));
                return false;
            }else{
                res.render('notification', {
                    full_address,
                    token,
                    notification: user.notification.reverse(),
                });
            }
        }).catch(error => {
            console.log(error)
        })
    }
});

module.exports = router;