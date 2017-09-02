const express = require('express');
const router = express.Router();
const Users = require('../schema/Users');
const Tracks = require('../schema/Tracks');
const escape = require('escape-html');

router.post('/add', (req, res) => {
    const userId = req.body.userid;
    const token = req.hsAuth.token;
    let queryObject = {};
    if(req.query.bypass === 'true'){
        queryObject = {
            token,
        }
    }else{
        if(!userId){
            res.json({
                error: true,
                msg: 'Missing the user ID',
                code: 'missing_require_fields',
            });
            return false;
        }

        queryObject = {
            _id: userId,
        }
    }

    // find the users
    Users.findOne(queryObject)
    .then(user => {
        if(user === null){
            res.json({
                error: true,
                msg: 'Can not find your user ID',
                code: 'unexpected_result',
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
            const trackid = req.body.trackid;

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
            })
            .then(track => {

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
            .catch(error => {
                if(error.message.includes('Cast to ObjectId failed for value')){
                    res.json({
                        error: true,
                        msg: 'Can\'t not found your track id',
                        code: 'unexpected_result',
                    });
                    return false;
                }else{
                    console.log(error)
                }
            })
        }
    })
    .catch(error => {
        if(error.message.includes('Cast to ObjectId failed for value')){
            res.json({
                error: true,
                msg: 'Can\'t not found your user id',
                code: 'unexpected_result',
            });
            return false;
        }else{
            console.log(error)
        }
    });
});

module.exports = router;