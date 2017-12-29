const express = require('express');
const router = express.Router();
const Tracks = require('../schema/Tracks');
const Users = require('../schema/Users');
const rp = require('request-promise');


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
            rp.get(user.icon).pipe(res);
        }
    }

    async findCoverart(id){
        const req = this.req;
        const res = this.res;
        const track = await Tracks.findOne({id});
        if(!track){
            res.json({
                error: 'Track does not exists',
                code: 'unexpected_result',
            });
            return false;
        }else{
            rp.get(track.coverImage).pipe(res);
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
            rp.get(user.banner).pipe(res);
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

        default:{
            res.json({
                error: 'Unsupport type of image',
                code: 'unexpected_result',
            });
            return false;
        }

        case 'avatar':{
            image.findUserAvatar(argument);
        }

        case 'coverart': {
            image.findCoverart(argument);
        }

        case 'banner': {
            image.findUserBanner(argument);
        }
    }
});

module.exports = router;