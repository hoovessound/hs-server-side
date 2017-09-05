const express = require('express');
const router = express.Router();
const Users = require('../schema/Users');
const Tracks = require('../schema/Tracks');

class UserClass {
    constructor(req, res){
        this.res = res;
        this.req = req;
    }

    async findByUsername(){
        try {
            const profile = await Users.findOne({
                username: this.req.params.username,
            }, {
                password: 0,
                token: 0,
            });

            const tracks = await Tracks.find({
                'author.username': this.req.params.username,
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
            if(error.message.includes('Cast to ObjectId failed for value')){
                res.json({
                    error: true,
                    msg: 'Can\'t not found your user id',
                    code: 'unexpected_result',
                });
                return false;
            }else{
                console.log(error)
            }
        }
    }

    async findByToken(){
        try {
            const profile = await Users.findOne({
                _id: this.req.params.id,
            }, {
                password: 0,
                token: 0,
            });

            const tracks = await Tracks.find({
                _id: this.req.params.id,
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
            if(error.message.includes('Cast to ObjectId failed for value')){
                res.json({
                    error: true,
                    msg: 'Can\'t not found your user id',
                    code: 'unexpected_result',
                });
                return false;
            }else{
                console.log(error)
            }
        }
    }
}

router.get('/:method?/:username?', (req, res) => {
    const username = req.params.username;
    const method = req.params.method;
    const userClass = new UserClass(req, res);

    if(typeof method === 'undefined'){
        res.json({
            error: true,
            msg: 'Missing the method fields',
            code: 'missing_require_fields',
        });
        return false;
    }

    if(method === 'id'){
        userClass.findByToken();
    }else if(method === 'username'){
        userClass.findByUsername();
    }

    else{
        res.json({
            error: true,
            msg: 'Unknown querying method',
            code: 'unexpected_result',
        });
        return false;
    }

});

module.exports = router;