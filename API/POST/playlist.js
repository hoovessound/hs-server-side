const express = require('express');
const router = express.Router();
const Playlists = require('../../schema/Playlists');
const Tracks = require('../../schema/Tracks');
const Users = require('../../schema/Users');
const genId = require('../../src/helper/genId');

class playlist {
    constructor(req, res){
        this.req = req;
        this.res = res;
    }

    async createNewPlaylist(payload){
        const req = this.req;
        const res = this.res;
        const data = {
            id: genId(),
            title: payload.title,
            author: req.hsAuth.user.id,
            tracks: payload.tracks,
            coverImage: payload.coverImage,
        };
        try{
            await new Playlists(data).save();
            res.json(data);
        }
        catch(error){
            console.log(error);
        }
    }

    async addTrack(playlist, track){
        const req = this.req;
        const res = this.res;
        if(!playlist.tracks.includes(track.id)){
            playlist.tracks.push(track.id);
            await Playlists.update({
                _id: playlist._id
            }, playlist);
            res.json({
                success: true,
                tracks: playlist.tracks,
            })
        }else{
            res.json({
                success: true,
                tracks: playlist.tracks,
            })
        }
    }

    async deleteTrack(playlist, track){
        const req = this.req;
        const res = this.res;
        if(playlist.tracks.includes(track.id)){
            playlist.tracks.splice(playlist.tracks.indexOf(track.id), 1);
            await Playlists.update({
                _id: playlist._id
            }, playlist);
            res.json({
                success: true,
                tracks: playlist.tracks,
            });
        }else{
            res.json({
                success: true,
                tracks: playlist.tracks,
            });
        }
    }

}
// Playlist does not exists
router.post('/create', (req, res) => {
    const p = new playlist(req, res);
    const payload = req.body;
    if(!payload.title){
        res.status(403);
        res.json({
            error: 'Missing the playlist title',
        });
        return false;
    }

    if(!payload.tracks){
        res.status(403);
        res.json({
            error: 'Please put at less one track at a new playlist',
        });
        return false;
    }

    if(payload.tracks.length <= 0){
        res.status(403);
        res.json({
            error: 'Please put at less one track at a new playlist',
        });
        return false;
    }
    
    // Check if the track exists or not
    const tracksJobs = [];
    async function fetchTrack(id){
        return await Tracks.findOne({id});
    }
    payload.tracks.map(id => {
        tracksJobs.push(fetchTrack(id));
    });
    Promise.all(tracksJobs)
    .then(tracks => {
        tracks.map((track, index) => {
            if(!track){
                res.status(403);
                res.json({
                    error: `Track ${payload.tracks[index]} does not exists`,
                })
                return false;
            }
        })
        p.createNewPlaylist(payload);
    })
    .catch(error => {
        console.log(error);
    })
});

router.post('/add/:playlistId?/:trackId?', (req, res) => {
    const p = new playlist(req, res);
    const trackId = req.params.trackId;
    const playlistId = req.params.playlistId;

    if(!trackId){
        res.status(403);
        res.json({
            error: 'Missing the track ID',
        });
        return false;
    }

    if(!playlistId){
        res.status(403);
        res.json({
            error: 'Missing the playlist ID',
        });
        return false;
    }
    
    // Check if the track exists or not
    Playlists.findOne({id: playlistId})
    .then(playlist => {
        if(!playlist){
            res.status(403);
            res.json({
                error: 'Playlist does not exits',
            });
            return false;
        }else{
            Tracks.findOne({id: trackId})
            .then(track => {
                if(!track){
                    res.status(403);
                    res.json({
                        error: 'Track does not exits',
                    });
                    return false;
                }else{
                    p.addTrack(playlist, track);
                }
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

router.delete('/remove/:playlistId?/:trackId?', (req, res) => {
    const p = new playlist(req, res);
    const trackId = req.params.trackId;
    const playlistId = req.params.playlistId;

    if(!trackId){
        res.status(403);
        res.json({
            error: 'Missing the track ID',
        });
        return false;
    }

    if(!playlistId){
        res.status(403);
        res.json({
            error: 'Missing the playlist ID',
        });
        return false;
    }
    
    // Check if the track exists or not
    Playlists.findOne({id: playlistId})
    .then(playlist => {
        if(!playlist){
            res.status(403);
            res.json({
                error: 'Playlist does not exits',
            });
            return false;
        }else{
            Tracks.findOne({id: trackId})
            .then(track => {
                if(!track){
                    res.status(403);
                    res.json({
                        error: 'Track does not exits',
                    });
                    return false;
                }else{
                    p.deleteTrack(playlist, track);
                }
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