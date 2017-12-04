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
        this.res.json({
            id: this.req.hsAuth.user.id,
            username: this.req.hsAuth.user.username,
            fullname: this.req.hsAuth.user.fullname,
            email: this.req.hsAuth.user.email,
            icon: this.req.hsAuth.user.icon,
            roles: this.req.hsAuth.user.roles,
            fave: this.req.hsAuth.user.fave,
            banner: this.req.hsAuth.user.banner,
            icon: this.req.hsAuth.user.icon,
            tracks: this.req.hsAuth.user.tracks,
            history: this.req.hsAuth.user.lastPlay,
        });
    }

}

router.get('/', (req, res) => {
    const token = req.body.token || req.headers.token || req.query.token;
    const me = new Me(req, res);
    me.findThisUserTracks();
});

module.exports = router;