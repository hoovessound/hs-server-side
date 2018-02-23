const express = require('express');
const router = express.Router();
const Tracks = require('../../schema/Tracks');
const Users = require('../../schema/Users');
const Playlists = require('../../schema/Playlists');
const Doodles = require('../../schema/Doodles');
const rp = require('request-promise');
const Jimp = require('jimp');

class Image {
    constructor(req, res){
        this.req = req;
        this.res = res;
    }

    async findUserAvatar(username){
        const res = this.res;
        const user = await Users.findOne({username});
        if(!user){
            res.status(403);
            res.json({
                error: 'User does not exists',
            });
            return false;
        }else{
            this.resize(user.icon);
        }
    }

    async findTrackCoverart(id){
        const res = this.res;
        const track = await Tracks.findOne({id});
        if(!track){
            const defaultImage = 'https://storage.googleapis.com/hs-static/missing_track.jpg';
            rp.get(defaultImage).pipe(res);
            return false;
        }else{
            this.resize(track.coverImage);
        }
    }

    async findUserBanner(username){
        const res = this.res;
        const user = await Users.findOne({username});
        if(!user){
            res.status(403);
            res.json({
                error: 'Doodle does not exists',
            });
            return false;
        }else{
            this.resize(doodle.image);
        }
    }

    async findPlaylist(id){
        const res = this.res;
        const playlist = await Playlists.findOne({id});
        if(!playlist){
            res.status(403);
            res.json({
                error: 'Playlist does not exists',
            });
            return false;
        }else{
            this.resize(playlist.coverImage);
        }
    }

    async findDoodle(id){
        const res = this.res;
        const doodle = await Doodles.findOne({id});
        if(!doodle){
            res.status(403);
            res.json({
                error: 'Playlist does not exists',
            });
            return false;
        }else{
            this.resize(doodle.image);
        }
    }

    async proxy(url){
        this.resize(url);
    }

    resize(imageUrl){
        if(!imageUrl){
            imageUrl = 'https://storage.googleapis.com/hs-static/missing_track.jpg';
        }
        const req = this.req;
        const res = this.res;
        const rawWith = req.query.width;
        const rawHeight = req.query.height;

        if(rawWith || rawHeight){
            Jimp.read(imageUrl, (error, img) => {
                if(error){
                    console.log(error);
                }
                let width;
                let height;

                if(rawWith){
                    width = parseInt(rawWith);
                }

                if(rawHeight){
                    height = parseInt(rawHeight);
                }

                if(rawWith && !rawHeight){
                    height = parseInt(rawWith);
                }

                if(rawHeight && !rawWith){
                    width = parseInt(rawHeight);
                }
                img.resize(width, height).getBuffer(Jimp.AUTO, function(e,buffer){
                    res.type(img.getMIME());
                    res.setHeader('Cache-Control', 'no-cache');
                    res.end(buffer);
                });
            });
            return false;
        }else{
            res.setHeader('Cache-Control', 'no-cache');
            rp.get(imageUrl).pipe(res);
        }
    }

}

router.get('/:type?/:argument?', (req, res) => {
    const type = req.params.type;
    const argument = req.params.argument;
    const image = new Image(req, res);
    if(!type){
        res.status(403);
        res.json({
            error: 'Missing the type field',
        });
        return false;
    }

    if(type !== 'proxy' && !argument){
        res.status(403);
        res.json({
            error: 'Missing the argument field',
        });
        return false;
    }

    switch(type){

        case 'avatar':{
            image.findUserAvatar(argument);
            break;
        }

        case 'coverart': {
            image.findTrackCoverart(argument);
            break;
        }

        case 'banner': {
            image.findUserBanner(argument);
            break;
        }

        case 'playlist': {
            image.findPlaylist(argument);
            break;
        }

        case 'doodle': {
            image.findDoodle(argument);
            break;
        }

        case 'proxy': {
            image.proxy(req.query.url);
            break;
        }

        default:{
            res.status(403);
            res.json({
                error: 'Unsupport type of image',
            });
            return false;
        }
    }
});

module.exports = router;