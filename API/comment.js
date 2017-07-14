const express = require('express');
const router = express.Router();
const Users = require('../schema/Users');
const Tracks = require('../schema/Tracks');

router.post('/add', (req, res) => {
    const token = req.body.token || req.headers.token || req.query.token;
    // find the users

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
            // success
            const comment = req.body.comment;
            const trackid = req.body.trackid;

            if(typeof comment === 'undefined') {
                res.json({
                    error: true,
                    msg: 'Missing the comment field',
                    code: 'missing_require_fields',
                });
                return false;
            }

            if(typeof trackid === 'undefined') {
                res.json({
                    error: true,
                    msg: 'Missing the trackid field',
                    code: 'missing_require_fields',
                });
                return false;
            }

            return Tracks.findOne({
                _id: trackid
            }).then(track => {

                if(track === null){
                    res.json({
                        error: true,
                        msg: 'Your trackid might be incorrect',
                    });
                    return false;
                }

                // Add the comment into this track
                const commentObject = {
                    author: user._id,
                    postDate: new Date(),
                    comment: comment,
                };
                track.comments.push(commentObject);
                // save the new data back to the db
                return Tracks.update({
                    _id: trackid,
                }, track).then(track => {
                    res.json({
                        commentObject,
                        author: {
                            username: user.username,
                            fullName: user.fullName,
                        },
                    });
                });
            })
        }
    }).catch(error => {
        console.log(error);
    });
});

module.exports = router;