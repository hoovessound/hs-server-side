const express = require('express');
const router = express.Router();
const Users = require('../schema/Users');
const Tracks = require('../schema/Tracks');

router.get('/', (req, res) => {

    const offset = parseInt(req.query.offset) || 0;
    // Find tracks
    Tracks.find({
        private: false,
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
        }else{
            const jobs = [];
            async function fetchUser(id){
                const user = await Users.findOne({
                    id,
                });
                return({
                    username: user.username,
                    fullname: user.fullName,
                    id: user.id,
                });
            }
            tracks.map(track => {
                jobs.push(fetchUser(track.author));
            });
            let hostname = req.hostname;
            if(process.env.NODE_ENV !== 'production'){
                hostname += ':3000';
            }
            Promise.all(jobs)
            .then(authors => {
                authors.map((author, index) => {
                    tracks[index].author = author;
                    tracks[index].coverImage = `${req.protocol}://${hostname}/image/coverart/${tracks[index].id}`;
                });
                res.json(tracks);
            })
            .catch(error => {
                console.log(error);
            })
        }
    })
    .catch(error => {
        console.log(error);
    })
});
module.exports = router;