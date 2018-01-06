const express = require('express');
const router = express.Router();
const Tracks = require('../../schema/Tracks');
const Users = require('../../schema/Users');

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

            if(!this.req.query.bypass){
                if(track.private){
                    // Check permission
                    if(!this.req.hsAuth.app.permission.includes('private_track')){
                        this.res.json({
                            error: 'Bad permission scoping',
                            code: 'service_lock_down',
                        });
                        return false;
                    }
                }
            }

            if(!track){
                this.res.json({
                    error: 'Can\'t not that track id',
                    code: 'unexpected_result',
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
                this.res.json({
                    error: 'Can\'t not that track id',
                    code: 'unexpected_result',
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
        res.json({
            error: true,
            msg: 'Missing the ID field',
            code: 'missing_require_fields',
        });
        return false;
    }
    findTrack.findById(ID);
});

router.get('/comment/:id?', (req, res) => {
    const trackid = req.params.id;
    const findTrack = new FindTrack(res, req);
    if (!trackid) {
        res.json({
            error: true,
            msg: 'Missing the trackid field',
            code: 'missing_require_fields',
        });
        return false;
    }
    findTrack.getComment(trackid);
});

module.exports = router;