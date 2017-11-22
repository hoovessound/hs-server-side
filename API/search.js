const express = require('express');
const router = express.Router();
const Users = require('../schema/Users');
const Tracks = require('../schema/Tracks');
const Tags = require('../schema/Tags');

router.get('/:query?', (req, res) => {
    const query = req.params.query;
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
            _id: 0,
            __v: 0,
            thirdparty: 0,
            notification: 0,
            lastPlay: 0,
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
            _id: 0,
            __v: 0,
            comments: 0,
            fave: 0,
        }),
        Tags.findOne({
            name: req.params.query,
        }, {
            _id: 0,
            __v: 0,
            tracks: 0,
        })
    ])
    .then(response => {
        res.json({
            users: response[0],
            tracks: response[1],
            tags: response[2],
        })
    })
});

module.exports = router;