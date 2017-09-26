const express = require('express');
const router = express.Router();
const Users = require('../schema/Users');
const Tracks = require('../schema/Tracks');

class Me {
    constructor(req, res){
        this.res = res;
        this.req = req;
    }

    async findThisUserTracks(){
        // Find the user's tracks
        const offset = parseInt(this.req.query.offset) || 0;
        const tracks = await Tracks.find({
            'author.username': this.req.hsAuth.user.username,
        }, {
            file: 0,
        }).limit(10).skip(offset).sort({uploadDate: -1});
        this.res.json({
            user: {
                id: this.req.hsAuth._id,
                username: this.req.hsAuth.user.username,
                fullname: this.req.hsAuth.user.fullname,
                email: this.req.hsAuth.user.email,
                icon: this.req.hsAuth.user.icon,
                roles: this.req.hsAuth.user.roles,
                fave: this.req.hsAuth.user.fave,
                banner: this.req.hsAuth.user.banner,
                icon: this.req.hsAuth.user.icon,
            },
            tracks,
        });
    }

}

router.get('/', (req, res) => {
    const token = req.body.token || req.headers.token || req.query.token;
    const me = new Me(req, res);
    me.findThisUserTracks();
});

module.exports = router;