const express = require('express');
const router = express.Router();
const Users = require('../schema/Users');
const Tracks = require('../schema/Tracks');

router.get('/', (req, res) => {

    const offset = parseInt(req.query.offset) || 0;
    // Find tracks
    Tracks.find({
        private: false,
    })
    .limit(10)
    .skip(offset)
    .sort({uploadDate: -1})
    .then(tracks => {

        if(tracks.length <= 0){
            res.json({
                tracks: [],
            })
            return false;
        }
        let finish = 0;
        tracks.forEach((track, index) => {
            return Users.findOne({
                id: track.author,
            })
            .then(user => {
                const username = user.username;
                const fullName = user.fullName;
                tracks[index].author = {
                    username,
                    fullName,
                };
                finish++;
                if(tracks.length === finish ){
                    // Finish
                    res.json({
                        id: track.id,
                        title: track.title,
                        author: {
                            username,
                            fullName
                        },
                        uploadDate: track.uploadDate,
                        description: track.description,
                        tags: track.tags,
                        private: track.private,
                        coverImage: track.coverImage,
                    })
                }
            })
            .catch(error => {
                console.log(error);
            })
        })
    })
    .catch(error => {
        console.log(error);
    })
});
module.exports = router;