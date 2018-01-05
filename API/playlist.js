const express = require('express');
const router = express.Router();
const Playlists = require('../schema/Playlists');
const Tracks = require('../schema/Tracks');
const Users = require('../schema/Users');
const path = require('path');
const gcs = require('@google-cloud/storage')({
    projectId: 'hoovessound',
    keyFilename: require('../src/index').gcsPath,
});
const genId = require('../src/helper/genId');

class playlist {
    constructor(req, res){
        this.req = req;
        this.res = res;
    }
    async get(id){
        const req = this.req;
        const res = this.res;
        try{
            const playlist = await Playlists.findOne({id}, {
                id: 1,
                title: 1,
                author: 1,
                tracks: 1,
                coverImage: 1,
                _id: 0,
            });
            let hostname = this.req.hostname;
            if(process.env.NODE_ENV !== 'production'){
                hostname += ':3000';
            }
            playlist.coverImage = `${this.req.protocol}://${hostname}/image/playlist/${playlist.id}`;
            const author = await Users.findOne({id: playlist.author});
            playlist.author = {
                id: author.id,
                username: author.username,
                fullname: author.fullName,
            }
            res.json(playlist);
        }
        catch(error){
            console.log(error);
        }
    }
    async add(payload){
        const req = this.req;
        const res = this.res;
        const playlistId = genId(30);
        const data = {
            id: playlistId,
            title: payload.title,
            author: req.hsAuth.user.id,
            tracks: payload.tracks,
            coverImage: payload.coverImage,
        }
        try{
            await new Playlists(data).save();
            res.json(data);
        }
        catch(error){
            console.log(error);
        }
    }
}
// Playlist does not exists
router.get('/:id?', (req, res) => {
    const p = new playlist(req, res);
    const id = req.params.id;
    if(!id){
        res.json({
            error: 'Missing playlist ID',
            code: 'missing_require_fields',
        });
        return false;
    }else{
        p.get(id);
    }
});

router.post('/:id?', (req, res) => {
    const p = new playlist(req, res);
    const payload = req.body;
    if(!payload.title){
        res.json({
            error: 'Missing playlist title',
            code: 'missing_require_fields',
        });
        return false;
    }
    if(!payload.tracks){
        res.json({
            error: 'Put at less one track',
            code: 'missing_require_fields',
        });
        return false;
    }
    if(!payload.tracks.length <= 0){
        if(!payload.tracks){
            res.json({
                error: 'Put at less one track',
                code: 'missing_require_fields',
            });
            return false;
        }
    }
    // Check if the track exists or not
    const jobs = [];
    async function findTrack(id){
        try{
            return await Tracks.findOne({id});
        }
        catch(error){
            console.log(error);
        }
    }
    payload.tracks.map(trackId => {
        jobs.push(findTrack(trackId));
    });
    Promise.all(jobs)
    .then(tracks => {
        tracks.map((track, index) => {
            if(!track){
                res.json({
                    error: `Track ${req.body.tracks[index]} does not exists`,
                    code: 'unexpected_result',
                })
                return false;
            }
        });
        // All good
        p.add(payload);
    })
    .catch(error => {
        console.log(error);
    })
});

module.exports = router;