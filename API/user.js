const express = require('express');
const router = express.Router();
const Tracks = require('../schema/Tracks');
const Users = require('../schema/Users');
const xFrameOptions = require('x-frame-options')

class User {
    constructor(req, res){
        this.req = req;
        this.res = res;
    }

    async findUser(username){
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
                error: 'Missing the "message" field',
                code: 'unexpected_result',
            });
            return false;
        }else{
            user['fullname'] = user.fullName;
            res.json(user);
        }
    }
}

router.get('/:username?', (req, res) => {
    const user = new User(req, res);
    const username = req.params.username;
    if(!username){
        res.json({
            error: 'Missing username argument',
            code: 'missing_require_fields',
        });
        return false;
    }
    user.findUser(username);
});

module.exports = router;