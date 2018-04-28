const express = require('express');
const router = express.Router();
const Users = require('../../schema/Users');
const Tracks = require('../../schema/Tracks');
const Playlists = require('../../schema/Playlists');
const Doodles = require('../../schema/Doodles');
const Notification = require('../functions/notification');

const TrackResponse = require('../../responseSchema/Track');

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
        res.json({
            id: hsAuth.user.id,
            username: hsAuth.user.username,
            fullname: hsAuth.user.fullName,
            email: hsAuth.user.email,
            icon: `${req.protocol}://${hostname}/image/avatar/${hsAuth.user.username}`,
            roles: hsAuth.user.roles,
            fave: hsAuth.user.fave,
            banner: `${req.protocol}://${hostname}/image/banner/${hsAuth.user.username}`,
            history: hsAuth.user.lastPlay,
            unreadNotification: hsAuth.user.unreadNotification,
        });
    }

    async findMyFavorites(){
        const req = this.req;
        const res = this.res;
        const hsAuth = req.hsAuth;
        const user = hsAuth.user;
        const authorsJob = [];
        const existsAuthors = [];


        let hostname = req.hostname;
        if(process.env.NODE_ENV !== 'production'){
            hostname += ':3000';
        }
        let updateUser = false;
        const tracks = await Tracks.find({
            id: {
                $in: user.fave,
            }
        },{
            ...TrackResponse,
        });

        // Fetch the author object

        tracks.map(track => {
            if(track){
                if(!existsAuthors.includes(track.author)){
                    existsAuthors.push(track.author);
                }
            }else{
                // The track is been removed
                // So remove also remove it from the user's collections
                const trackId = user.fave[index];
                user.fave.splice(user.fave.indexOf(trackId), 1);
                tracks.splice(tracks.indexOf(trackId), 1);
                updateUser = true;
            }
        });

        const authors = await Users.find({
            id: {
                $in: existsAuthors,
            }
        });
        tracks.map((track, index) => {
            authors.map(author => {
                if(track.author === author.id){
                    tracks[index].author = {
                        id: author.id,
                        username: author.username,
                        fullname: author.fullName,
                    };
                }
            });
            tracks[index].coverImage = `${req.protocol}://api.hoovessound.ml/image/coverart/${track.id}`;
        });

        if(updateUser){
            authorsJob.push(Users.update({_id: user._id}, user));
            const notification = new Notification(user);
            notification.send({
                to: user.id,
                message: 'We have to remove one of your track from your favorites collection, due to the track is no longer available on HoovesSound',
                title: 'A track has been remove your favorite collection',
                icon: 'https://storage.googleapis.com/hs-static/favicon.png',
            });
        }

        res.json(tracks);
    }

    async findPlaylists(){
        const req = this.req;
        const res = this.res;
        const user = req.hsAuth.user;
        const playlists = await Playlists.find({
            author: user.id,
        },
        {
            id: 1,
            title: 1,
            author: 1,
            tracks: 1,
            coverImage: 1,
            _id: 0,
        });
        playlists.map((p, index) => {
            playlists[index].author = {
                id: user.id,
                username: user.username,
                fullname: user.fullName,
            }
        });
        res.json(playlists.reverse());
    }

    async findTracks(){
        const req = this.req;
        const res = this.res;
        const user = req.hsAuth.user;
        const tracks = await Tracks.find({
            author: user.id,
        },
        {
            ...TrackResponse,
        });
        tracks.map((track, index) => {
            tracks[index].author = {
                id: user.id,
                fullname: user.fullName,
                username: user.username,
            };
        });
        res.json(tracks.reverse());

    }

    async findDoodles(){
        const req = this.req;
        const res = this.res;
        const user = req.hsAuth.user;

        const doodles = await Doodles.find({
            author: user.id,
        }, {
            id: 1,
            title: 1,
            image: 1,
            author: 1,
            link: 1,
            pending: 1,
            used: 1,
            _id: 0,
        });
        res.json(doodles);
    }

}

router.get('/', (req, res) => {
    const me = new Me(req, res);
    me.findThisUserTracks();
});

router.get('/favorites', (req, res) => {
    const me = new Me(req, res);
    me.findMyFavorites();
});

router.get('/playlists', (req, res) => {
    const me = new Me(req, res);
    me.findPlaylists();
});

router.get('/tracks', (req, res) => {
    const me = new Me(req, res);
    me.findTracks();
});

router.get('/doodles', (req, res) => {
    const me = new Me(req, res);
    me.findDoodles();
});

module.exports = router;