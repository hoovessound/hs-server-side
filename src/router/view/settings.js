const express = require('express');
const router = express.Router();
const rp = require('request-promise');
const fullurl = require('fullurl');
const Users = require('../../../schema/Users');

router.get('/', (req, res) => {
    const full_address = req.protocol + "://" + req.headers.host;
    if(!req.cookies['oauth-token']){
        res.end('Access denied');
    }else{
        const token = req.cookies['oauth-token'];

        return Users.findOne({
            token: token,
        }).then(user => {
            if (user === null) {
                res.end('Access denied');
            }else{
                res.render('settings', {
                    loginUser: user,
                    error: null,
                    token,
                });
            }
        });
    }
});

module.exports = router;