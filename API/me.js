const express = require('express');
const router = express.Router();
const Users = require('../schema/Users');
const Tracks = require('../schema/Tracks');

async function authUser(res, token) {
    const user = await Users.findOne({token});
    return new Promise((ref, rej) => {
        if(user === null){
            const object = {
                error: true,
                msg: 'Can not find your token',
                code: 'token_not_found',
            };
            res.json(object);
            rej(object);
        }else{
            ref(user);
        }
    });
}

class Me {
    constructor(res, token, req){
        this.res = res;
        this.token = token;
        this.req = req;
    }

    async findThisUserTracks(){
        try{
            const user = await authUser(this.res, this.token);
            if(user){
                // Find the user's tracks
                const offset = parseInt(this.req.query.offset) || 0;
                const tracks = await Tracks.find({
                    'author.username': user.username,
                }, {
                    file: 0,
                }).limit(10).skip(offset).sort({uploadDate: -1});
                this.res.json(tracks);
            }
        }
        catch(error){
            console.log(error);
        }
    }

}

router.get('/', (req, res) => {
    const token = req.body.token || req.headers.token || req.query.token;
    const me = new Me(res, token, req);
    me.findThisUserTracks();
});

module.exports = router;