const express = require('express');
const router = express.Router();
const Tracks = require('../../schema/Tracks');
const Users = require('../../schema/Users');


const TrackResponse = require('../../responseSchema/Track');
class FindTrack {

    constructor(res, req){
        this.res = res;
        this.req = req;
    }

    async findById(id){
        try{
            const track = await Tracks.findOne({
                id,
            }, {
                ...TrackResponse,
            });

            if(!this.req.query.bypass){
                if(track.private){
                    // Check permission
                    if(!this.req.hsAuth.app.permission.includes('private_track')){
                        res.status(401);
                        this.res.json({
                            error: 'Bad permission scoping',
                        });
                        return false;
                    }
                }
            }

            if(!track){
                res.status(403);
                this.res.json({
                    error: 'Can\'t not that track id',
                });
                return false;
            }

            // Find the author

            return Users.findOne({
                id: track.author
            })
            .then(author => {
                track.author = {
                    username: author.username,
                    fullname: author.fullName,
                    id: author.id,
                }
                let hostname = this.req.hostname;
                if(process.env.NODE_ENV !== 'production'){
                    hostname += ':3000';
                }
                track.coverImage = `${this.req.protocol}://${hostname}/image/coverart/${track.id}`;
                this.res.json(track);
            })
        }
        catch(error){
            console.log(error)
        }
    }

    async getComment(trackId){
        const req = this.req;
        const res = this.res;
        try{
            const track = await Tracks.findOne({
                id: trackId,
            })

            if(!track){
                res.status(403);
                this.res.json({
                    error: 'Can\'t not that track id',
                });
                return false;
            }

            async function getUser(comment, index){
                try{
                    const user = await Users.findOne({
                        id: comment.author,
                    })
                    return ({
                        username: user.username,
                        fullName: user.fullName,
                    });
                }
                catch(error){
                    console.log(error);
                }
            }

            if(track.comments.length <= 0){
                this.res.json([]);
            }else{
                const jobs = []
                track.comments.map((comment, index) => {
                    jobs.push(getUser(comment, index));
                });
                return Promise.all(jobs)
                .then(response => {
                    response.map((author, index) => {
                        // Put the author back in the correct spot
                        track.comments[index].author = author;
                    });
                    res.json(track.comments)
                })
                .catch(error => {
                    console.log(error);
                })
            }
        }
        catch(error){
            console.log(error)
        }
    }
}

router.get('/:id', (req, res) => {
    const ID = req.params.id;
    const findTrack = new FindTrack(res,req);
    if(!ID){
        res.status(403);
        res.json({
            error: true,
            msg: 'Missing the ID field',
        });
        return false;
    }
    findTrack.findById(ID);
});

router.get('/comment/:id?', (req, res) => {
    const trackid = req.params.id;
    const findTrack = new FindTrack(res, req);
    if (!trackid) {
        res.status(403);
        res.json({
            error: true,
            msg: 'Missing the trackid field',
        });
        return false;
    }
    findTrack.getComment(trackid);
});

module.exports = router;