const express = require('express');
const router = express.Router();
const Users = require('../schema/Users');
const Tracks = require('../schema/Tracks');
const fullurl = require('fullurl');

router.get('/', (req, res) => {
    // Check for access token
    const token = req.body.token || req.headers.token || req.query.token;
    const offset = parseInt(req.query.offset) || 0;
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
            // Find the the latest 10 tracks order by the upload date
            return Tracks.find({
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
            }).limit(10).skip(offset).sort({uploadDate: -1})
                .then(tracks => {
                    return Tracks.count({})
                        .then(total => {
                            res.json({
                                tracks,
                                total,
                            });
                        })
                });
        }
    })
    .catch(error => {
        console.log(error);
    });
});
module.exports = router;