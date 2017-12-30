const express = require('express');
const router = express.Router();
const Users = require('../schema/Users');
const Tracks = require('../schema/Tracks');
const parseDomain = require('parse-domain');

class Me {
    constructor(req, res){
        this.res = res;
        this.req = req;
    }

    async findThisUserTracks(){
        const req = this.req;
        const res = this.res;
        const hsAuth = req.hsAuth;
        let hostname = req.hostname;
        if(process.env.NODE_ENV !== 'production'){
            hostname += ':3000';
        }
        this.res.json({
            id: hsAuth.user.id,
            username: hsAuth.user.username,
            fullname: hsAuth.user.fullName,
            email: hsAuth.user.email,
            icon: `${req.protocol}://${hostname}/image/avatar/${hsAuth.user.username}`,
            roles: hsAuth.user.roles,
            fave: hsAuth.user.fave,
            banner: `${req.protocol}://${hostname}/image/banner/${hsAuth.user.username}`,
            tracks: hsAuth.user.tracks,
            history: hsAuth.user.lastPlay,
        });
    }

    async findMyFavorites(){
        const req = this.req;
        const res = this.res;
        const hsAuth = req.hsAuth;
        const user = hsAuth.user;
        const responseObject = [];
        // Find the user favorite track IDs
        for(let faveId of user.fave){
            const track = await Tracks.findOne({id: faveId})
            // Fetch the author info
            const author = await Users.findOne({id: track.author});
            track.author = {
                username: author.username,
                fullname: author.fullName,
                id: author.id,
            }
            responseObject.push({
                id: track.id,
                title: track.title,
                uploadDate: track.uploadDate,
                author: track.author,
                description: track.description,
                tags: track.tags,
                private: track.private,
                coverImage: tracks[index].coverImage = `${req.protocol}://${hostname}/image/coverart/${tracks[index].id}`,
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