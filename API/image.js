const express = require('express');
const router = express.Router();
const Tracks = require('../schema/Tracks');
const Users = require('../schema/Users');
const rp = require('request-promise');
const Jimp = require('jimp');


class Image {
    constructor(req, res){
        this.req = req;
        this.res = res;
    }

    async findUserAvatar(username){
        const req = this.req;
        const res = this.res;
        const user = await Users.findOne({username});
        if(!user){
            res.json({
                error: 'User does not exists',
                code: 'unexpected_result',
            });
            return false;
        }else{
            this.resize(user.icon);
        }
    }

    async findTrackCoverart(id){
        const req = this.req;
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
        const req = this.req;
        const res = this.res;
        const user = await Users.findOne({username});
        if(!user){
            res.json({
                error: 'User does not exists',
                code: 'unexpected_result',
            });
            return false;
        }else{
            this.resize(user.banner);
        }
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
                    res.setHeader('Cache-Control', 'public, max-age=31557600');
                    res.end(buffer);
                });
            })
            return false;
        }else{
            res.setHeader('Cache-Control', 'public, max-age=31557600');
            rp.get(imageUrl).pipe(res);
        }
    }

}

router.get('/:type?/:argument?', (req, res) => {
    const type = req.params.type;
    const argument = req.params.argument;
    const image = new Image(req, res);
    if(!type){
        res.json({
            error: 'Missing the type field',
            code: 'unexpected_result',
        });
        return false;
    }

    if(!argument){
        res.json({
            error: 'Missing the argument field',
            code: 'unexpected_result',
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

        default:{
            res.json({
                error: 'Unsupport type of image',
                code: 'unexpected_result',
            });
            return false;
        }
    }
});

module.exports = router;