const express = require('express');
const router = express.Router();
const rp = require('request-promise');
const fullurl = require('fullurl');
const Users = require('../../schema/Users');
const Tracks = require('../../schema/Tracks');

router.get('/?', (req, res) => {
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
                return Users.findOne({
                    token,
                }).then(user => {
                    return Tracks.find({
                        private: false || null,
                    }).limit(10).skip(parseInt(offset)).sort({
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
                                offset,
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