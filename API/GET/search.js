const express = require('express');
const router = express.Router();
const Users = require('../../schema/Users');
const Tracks = require('../../schema/Tracks');
const Playlists = require('../../schema/Playlists');
const Tags = require('../../schema/Tags');

router.get('/:query?', (req, res) => {
    const query = req.params.query;
    if(typeof query === 'undefined'){
        res.status(403);
        res.json({
            error: true,
            msg: 'Missing the query',
        });
        return false;
    }

    // Search the query

    if(query.length <= 0){
        res.status(403);
        res.json({
            error: true,
            msg: 'Too less query keyword',
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
            username: 1,
            fullName: 1,
            email: 1,
            id: 1,
            lastPlay: 1,
            roles: 1,
            banner: 1,
            icon: 1,
            _id: 0,
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
            id: 1,
            title: 1,
            author: 1,
            uploadDate: 1,
            description: 1,
            tags: 1,
            private: 1,
            coverImage: 1,
            _id: 0,
            backgrounddrop: 1,
        }),
        Tags.findOne({
            name: req.params.query,
        }, {
            _id: 0,
            __v: 0,
            tracks: 0,
        }),
        Playlists.find({
            title: regex,
        }, {
            id: 1,
            title: 1,
            author: 1,
            tracks: 1,
            coverImage: 1,
            _id: 0,
        })
    ])
    .then(response => {
        res.json({
            users: response[0],
            tracks: response[1],
            tags: response[2],
            playlist: response[3],
        })
    })
});

module.exports = router;