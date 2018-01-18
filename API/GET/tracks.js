const express = require('express');
const router = express.Router();
const Users = require('../../schema/Users');
const Tracks = require('../../schema/Tracks');

class Track {

    constructor(req, res){
        this.req = req;
        this.res = res;
    }

    async findTracks(offset){
        // Find tracks
        try{
            const req = this.req;
            const res = this.res;
            const tracks = await Tracks.find({
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
            .sort({uploadDate: -1});

            if(tracks.length <= 0){
                res.json({
                    tracks: [],
                });
                return false;
            }else{
                const jobs = [];
                const existsAuthors = [];
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
                    if(!existsAuthors.includes(track.author)){
                        jobs.push(fetchUser(track.author));
                        existsAuthors.push(track.author);
                    }
                });
                let hostname = req.hostname;
                if(process.env.NODE_ENV !== 'production'){
                    hostname += ':3000';
                }
                const authors = await Promise.all(jobs);
                tracks.map((track, index) => {
                    authors.map(author => {
                        if(track.author === author.id){
                            tracks[index].author = author;
                        }
                    });
                });
                res.json(tracks);
            }

        }
        catch(error){
            console.log(error);
        }
    }
}

router.get('/', (req, res) => {
    const offset = parseInt(req.query.offset) || 0;
    const track = new Track(req, res);
    track.findTracks(offset);
});
module.exports = router;