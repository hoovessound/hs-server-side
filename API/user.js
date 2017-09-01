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

class UserClass {
    constructor(res, token, req){
        this.res = res;
        this.token = token;
        this.req = req;
    }

    async findByUsername(){
        try {
            const user = await authUser(this.res, this.token);
            const profile = await Users.findOne({
                username: user.username,
            }, {
                password: 0,
                token: 0,
            });

            const tracks = await Tracks.find({
                'author.username': username,
                $or: [
                    {
                        private: false,
                    },
                    {
                        private: {
                            $exists: false,
                        }
                    }
                ],
            }, {
                file: 0,

            }).sort({
                uploadDate: -1
            });

            this.res.json({
                user: profile,
                tracks,
            });

        }
        catch(error){
            console.log(error);
        }
    }

    async findByToken(){
        try {
            const user = await authUser(this.res, this.token);
            const profile = await Users.findOne({
                token: user.token,
            }, {
                password: 0,
                token: 0,
            });

            const tracks = await Tracks.find({
                _id: user._id,
                $or: [
                    {
                        private: false,
                    },
                    {
                        private: {
                            $exists: false,
                        }
                    }
                ],
            }, {
                file: 0,

            }).sort({
                uploadDate: -1
            });

            this.res.json({
                user: profile,
                tracks,
            });

        }
        catch(error){
            console.log(error);
        }
    }
}

router.get('/:method?/:username?', (req, res) => {
    const token = req.body.token || req.headers.token || req.query.token;
    const username = req.params.username;
    const method = req.params.method;
    const userClass = new UserClass(res, token);

    if(typeof method === 'undefined'){
        res.json({
            error: true,
            msg: 'Missing the method fields',
            code: 'missing_require_fields',
        });
        return false;
    }

    Users.findOne({
        token: token,
    }).then(user => {
        if(user === null){
            res.json({
                error: true,
                msg: 'Can not find your token',
                code: 'token_not_found',
            });
            return false;
        }else{
            let query;
            if(method === 'token'){
                userClass.findByToken();
            }else{
                userClass.findByUsername();
            }
        }
    })
    .catch(error => {
        if(error.message.includes('Cast to ObjectId failed for value')){
            res.json({
                error: true,
                msg: 'Can\'t not found your track',
                code: 'unexpected_result',
            });
            return false;
        }else{
            console.log(error)
        }
    });
});

module.exports = router;