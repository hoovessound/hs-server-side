const express = require('express');
const router = express.Router();
const Users = require('../schema/Users');
const Tracks = require('../schema/Tracks');

router.post('/:query?', (req, res) => {
    const token = req.body.token || req.headers.token || req.query.token;
    const query = req.params.query || req.query.query;
    Users.find({
        token: token,
    })
    .then(user => {
        if(user === null){
            res.json({
                error: true,
                msg: 'Can not find your token',
                code: 'token_not_found',
            });
            return false;
        }else{

            if(typeof query === 'undefined'){
                res.json({
                    error: true,
                    msg: 'Missing the query',
                    code: 'missing_require_fields',
                });
                return false;
            }

            // Search the query

            if(query.length <= 0){
                res.json({
                    error: true,
                    msg: 'Too less query keyword',
                    code: 'unexpected_result',
                });
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
                }, {
                    password: 0,
                    tracks: 0,
                    token: 0,
                }),
                Tracks.find({
                    title: regex,
                    $or: [
                        {
                            private: false,
                        },
                        {
                            private: {
                                $exists: false,
                            }
                        }
                    ]
                }, {
                    file: 0,
                })
            ])
            .then(response => {
                res.json({
                    users: response[0],
                    tracks: response[1],
                })
            })
        }
    })
    .catch(error => {
        console.log(error);
    })
});

module.exports = router;