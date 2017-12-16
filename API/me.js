const express = require('express');
const router = express.Router();
const Users = require('../schema/Users');
const Tracks = require('../schema/Tracks');

class Me {
    constructor(req, res){
        this.res = res;
        this.req = req;
    }

    async findThisUserTracks(){
        this.res.json({
            id: this.req.hsAuth.user.id,
            username: this.req.hsAuth.user.username,
            fullname: this.req.hsAuth.user.fullName,
            email: this.req.hsAuth.user.email,
            icon: this.req.hsAuth.user.icon,
            roles: this.req.hsAuth.user.roles,
            fave: this.req.hsAuth.user.fave,
            banner: this.req.hsAuth.user.banner,
            icon: this.req.hsAuth.user.icon,
            tracks: this.req.hsAuth.user.tracks,
            history: this.req.hsAuth.user.lastPlay,
        });
    }

    async findMyFavorites(){
        const user = this.req.hsAuth.user;
        const req = this.req;
        const res = this.res;
        const responseObject = []
        // Find the user favorite track IDs
        for(let faveId of user.fave){
            const track = await Tracks.findOne({id: faveId})
            // Fetch the author info
            const author = await Users.findOne({id: track.author});
            track.author = {
                username: author.username,
                fullname: author.fullName,
            }
            responseObject.push({
                id: track.id,
                title: track.title,
                uploadDate: track.uploadDate,
                author: track.author,
                description: track.description,
                tags: track.tags,
                private: track.private,
                coverImage: track.coverImage,
            })
        }
        res.json(responseObject)
    }

}

router.get('/', (req, res) => {
    const token = req.body.token || req.headers.token || req.query.token;
    const me = new Me(req, res);
    me.findThisUserTracks();
});

router.get('/favorites', (req, res) => {
    const token = req.body.token || req.headers.token || req.query.token;
    const me = new Me(req, res);
    me.findMyFavorites();
});

module.exports = router;