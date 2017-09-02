const express = require('express');
const router = express.Router();
const Users = require('../schema/Users');
const Tracks = require('../schema/Tracks');

async function authUser(res, id) {
    const user = await Users.findOne({_id: id});
    return new Promise((ref, rej) => {
        if(user === null){
            const object = {
                error: true,
                msg: 'can\'t not find your user ID',
                code: 'bad_authentication',
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
        this.id = req.query.userid;
        this.req = req;
    }

    async findThisUserTracks(){
        try{
            const user = await authUser(this.res, this.id);
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
            if(!error.code && !error.msg){
                console.log(error)
            }
        }
    }

}

router.get('/', (req, res) => {
    const token = req.body.token || req.headers.token || req.query.token;
    const me = new Me(res, token, req);
    me.findThisUserTracks();
});

module.exports = router;