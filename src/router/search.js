const express = require('express');
const router = express.Router();
const rp = require('request-promise');
const fullurl = require('fullurl');
const Users = require('../../schema/Users');
const Tracks = require('../../schema/Tracks');

router.get('/?', (req, res) => {
    const full_address = req.protocol + "://" + req.headers.host;
    if(!req.cookies['oauth-token']){
        res.redirect('/api/auth/login?redirect=' + fullurl(req));
    }else{
        const token = req.cookies['oauth-token'];
        const query = req.query.query ? req.query.query.trim() : null;
        Users.findOne({
            token: token,
        }).then(user => {
            if (user === null) {
                res.redirect('/api/auth/login?redirect=' + fullurl(req));
            }else{
                if(query === null){
                    res.redirect('/');
                    return false;
                }

                if(query.length <= 0){
                    res.redirect('/');
                    return false;
                }

                function escapeRegex(text) {
                    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
                };
                const regex = new RegExp(escapeRegex(query), 'ig');

                return Promise.all([
                    Users.find({
                        $or: [
                            {
                                username: regex,
                            },
                            {
                                fullName: regex,
                            }
                        ]
                    }, {password: 0, tracks: 0}),
                    Tracks.find({
                        title: regex,
                        private: false || null,
                    })
                ]).then(response => {
                    res.render('search', {
                        loginUser: user,
                        users: response[0],
                        tracks: response[1],
                        full_address,
                        token,
                    });
                })

            }
        }).catch(error => {
            console.log(error);
        });
    }
});

module.exports = router;