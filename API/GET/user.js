const express = require('express');
const router = express.Router();
const Tracks = require('../../schema/Tracks');
const Users = require('../../schema/Users');


const TrackResponse = require('../../responseSchema/Track');
class User {
    constructor(req, res){
        this.req = req;
        this.res = res;
    }

    async findUser(username, jsonResponse=true){
        const req = this.req;
        const res = this.res;
        let user = await Users.findOne({username}, {
            username: 1,
            fullName: 1,
            email: 1,
            id: 1,
            lastPlay: 1,
            roles: 1,
            banner: 1,
            icon: 1,
            _id: 0,
        });
        if(!user){
            res.json({
                error: 'User not exists',
                code: 'unexpected_result',
            });
            return false;
        }else{
            user['fullname'] = user.fullName;
            if(jsonResponse){
                res.json(user);
            }
            return user;
        }
    }

    async findUserTracks(username){
        const req = this.req;
        const res = this.res;
        const user = await this.findUser(username, false);
        const tracks = await Tracks.find({
            author: user.id,
            private: false,
        }, {
            ...TrackResponse,
        });
        tracks.map((track, index) => {
            tracks[index].author = {
                username: user.username,
                fullname: user.fullName,
                id: user.id,
            }
            tracks[index].coverImage = `${req.protocol}://api.hoovessound.ml/image/coverart/${track.id}`;
        });
        res.json(tracks.reverse());
    }
}

router.get('/:username?', (req, res) => {
    const user = new User(req, res);
    const username = req.params.username;
    if(!username){
        res.status(403);
        res.json({
            error: 'Missing username argument',
        });
        return false;
    }
    user.findUser(username);
});

router.get('/:username?/tracks', (req, res) => {
    const user = new User(req, res);
    const username = req.params.username;
    if(!username){
        res.status(403);
        res.json({
            error: 'Missing username argument',
        });
        return false;
    }
    user.findUserTracks(username);
});

module.exports = router;