const express = require('express');
const router = express.Router();
const Playlists = require('../../schema/Playlists');
const Tracks = require('../../schema/Tracks');
const Users = require('../../schema/Users');

const TrackResponse = require('../../responseSchema/Track');
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
            if(playlist){
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
                // Find tracks
                const jobs = [];
                async function fetchTrack(id){
                    return await Tracks.findOne({id}, {
                        ...TrackResponse,
                    });
                }
                playlist.tracks.map(id => {
                    jobs.push(fetchTrack(id));
                });
                const tracks = await Promise.all(jobs);
                playlist.tracks = tracks;
                // Fetch users
                const usersJobs = [];
                async function fetchUser(id){
                    const user = await Users.findOne({id});
                    return {
                        id: user.id,
                        username: user.username,
                        fullname: user.fullName,
                    }
                }
                tracks.map(track => {
                    usersJobs.push(fetchUser(track.author));
                });
                const users = await Promise.all(usersJobs);
                users.map((user, index) => {
                    playlist.tracks[index].author = user;
                });
                res.json(playlist);
            }else{
                res.json({
                    error: 'Playlist does not exists',
                    code: 'unexpected_result',
                });
                return false;
            }
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

module.exports = router;