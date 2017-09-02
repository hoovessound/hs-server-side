const express = require('express');
const router = express.Router();
const Users = require('../schema/Users');
const Tracks = require('../schema/Tracks');
const escape = require('escape-html');

router.post('/add', (req, res) => {
    const userId = req.body['user_id'];
    if(!userId){
        res.json({
            error: true,
            msg: 'Missing the user ID',
            code: 'missing_require_fields',
        });
        return false;
    }

    // find the users
    Users.findOne({
        _id: userId,
    }).then(user => {
        if(user === null){
            res.json({
                error: true,
                msg: 'Can not find your user ID',
                code: 'user_id_not_found',
            });
            return false;
        }else{
            // success

            if(!req.body.comment) {
                res.json({
                    error: true,
                    msg: 'Missing the comment field',
                    code: 'missing_require_fields',
                });
                return false;
            }

            const comment = escape(req.body.comment);
            const trackid = req.body['track_id'];

            if(!trackid) {
                res.json({
                    error: true,
                    msg: 'Missing the track id field',
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
                        msg: 'Your track id might be incorrect',
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