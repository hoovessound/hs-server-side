const express = require('express');
const router = express.Router();
const Users = require('../../schema/Users');
const Tracks = require('../../schema/Tracks');

const TrackResponse = require('../../responseSchema/Track');

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
                ...TrackResponse,
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
                    tracks[index].coverImage = `${req.protocol}://api.hoovessound.ml/image/coverart/${track.id}`;
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