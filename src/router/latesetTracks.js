const express = require('express');
const router = express.Router();
const rp = require('request-promise');
const fullurl = require('fullurl');
const Users = require('../../schema/Users');
const Tracks = require('../../schema/Tracks');

router.get('/:page?', (req, res) => {
    const full_address = req.protocol + "://" + req.headers.host;
    const page = req.params.page ? `${req.params.page}0` : 0;
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
                return Users.findOne({
                    token,
                }).then(user => {
                    return Tracks.find().limit(10).skip(parseInt(page)).sort({
                        uploadDate: -1
                    }).then(tracks => {
                        return Tracks.count({}).then(total => {
                            const totalPage = Math.round(total / 10);
                            res.render('index', {
                                loginUser: user,
                                tracks,
                                full_address,
                                token,
                                totalPage,
                            });
                        })
                    })
                })
            }
        }).catch(error => {
            console.log(error)
        })
    }
});

module.exports = router;