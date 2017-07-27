const express = require('express');
const router = express.Router();
const Users = require('../schema/Users');
const Tracks = require('../schema/Tracks');
const fullurl = require('fullurl');

router.get('/:method?/:username?', (req, res) => {
    const token = req.body.token || req.headers.token || req.query.token;
    const username = req.params.username;
    const method = req.params.method;

    if(typeof method === 'undefined'){
        res.json({
            error: true,
            msg: 'Missing the method fields',
            code: 'missing_require_fields',
        });
        return false;
    }

    Users.findOne({
        token: token,
    }).then(user => {
        if(user === null){
            res.json({
                error: true,
                msg: 'Can not find your token',
                code: 'token_not_found',
            });
            return false;
        }else{
            let query;
            if(method === 'token'){
                query = {
                    token,
                }
            }else{
                query = {
                    username,
                }
            }

            return Users.findOne(query, {
                password: 0,
                token: 0
            }).then(profile => {
                
                return Tracks.find({
                    'author.username': username,
                    $or: [
                        {
                            private: false,
                        },
                        {
                            private: {
                                $exists: false,
                            }
                        }
                    ],
                }, {
                    file: 0,

                }).sort({
                    uploadDate: -1
                })
                .then(tracks => {
                    res.json({
                        user: profile,
                        tracks,
                    });
                })

            });
        }
    })
    .catch(error => {
        if(error.message.includes('Cast to ObjectId failed for value')){
            res.json({
                error: true,
                msg: 'Can\'t not found your track',
                code: 'unexpected_result',
            });
            return false;
        }else{
            console.log(error)
        }
    });
});

module.exports = router;