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
        const tracksJob = [];
        const authorsJob = [];

        async function getTrack(id){
            return await Tracks.findOne({id}, {
                id: 1,
                title: 1,
                author: 1,
                uploadDate: 1,
                description: 1,
                tags: 1,
                private: 1,
                coverImage: 1,
                _id: 0,
            });
        }

        async function getAuthor(id){
            return await Users.findOne({id});
        }

        user.fave.map(id => {
            tracksJob.push(getTrack(id));
        })

        let hostname = req.hostname;
        if(process.env.NODE_ENV !== 'production'){
            hostname += ':3000';
        }

        Promise.all(tracksJob)
        .then(tracks => {
            // Find the author
            tracks.map(track => {
                const authorId = track.author;
                authorsJob.push(getAuthor(authorId));
            });
            Promise.all(authorsJob)
            .then(authors => {
                authors.map((author, index) => {
                    tracks[index].author = {
                        fullname: author.fullName,
                        username: author.username,
                        id: author.id,
                    }
                    tracks[index].coverImage = `${req.protocol}://${hostname}/image/coverart/${tracks[index].id}`;
                });
                res.json(tracks);
            })
            .catch(error => {
                console.log(error);
            })
        })
        .catch(error => {
            console.log(error);
        })
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