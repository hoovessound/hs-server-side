const express = require('express');
const router = express.Router();
const Users = require('../schema/Users');
const randomstring = require('randomstring');

router.get('/', (req, res) => {
    const token = req.body.token || req.headers.token || req.query.token;
    const id = req.query.id;
    Users.findOne({
        token: token,
    })
    .then(user => {
        if (user === null) {
            res.json({
                error: true,
                msg: 'Can not find your token',
                code: 'token_not_found',
            });
            return false;
        }else{
            // Find all the user's notification
            if(!id){
                res.json({
                    notifications: user.notification.reverse(),
                });
            }else{
                let findMsg = false;
                user.notification.forEach(msg => {
                    this.msg = msg;
                    findMsg = true;
                })
                if(!findMsg){
                    res.json({
                        error: true,
                        msg: 'Can\'t not that user id',
                        code: 'unexpected_result',
                    });
                    return false;
                }else{
                    res.json(this.msg);
                }
            }
        }
    })
    .catch(error => {
        if(error.message.includes('Cast to ObjectId failed for value')){
            res.json({
                error: true,
                msg: 'Can\'t not that user id',
                code: 'unexpected_result',
            });
            return false;
        }else{
            res.json({
                error: true,
                msg: 'Can\'t not that user id',
                code: 'unexpected_result',
            });
            return false;
        }
    });
});

router.post('/', (req, res) => {
    const token = req.body.token || req.headers.token || req.query.token;
    const id = req.query.id;
    Users.findOne({
        token: token,
    })
    .then(user => {
        if (user === null) {
            res.json({
                error: true,
                msg: 'Can not find your token',
                code: 'token_not_found',
            });
            return false;
        }else{
            // Search for that user
            const to = req.body.to;
            return Users.findById(to)
            .then(user => {
                // Settings up the user's notification stack
                let payload = req.body;
                const date = new Date();
                const ID = `${randomstring.generate(255)}${date.getHours()}${date.getMilliseconds()}`;
                payload.id = ID;
                payload.push_date = date;

                // Updating the user's notification stack locally

                user.notification.push(payload);

                // Save the message to the DB

                return Users.update({
                    _id: user._id,
                }, user)
                .then(() => {
                    // Send the payload via the socket
                    res.io.emit('notification:new', payload);
                    res.json(payload);
                })
            });
        }
    })
    .catch((error) => {
        if(error.message.includes('Cast to ObjectId failed for value')){
            res.json({
                error: true,
                msg: 'Can\'t not that user id',
                code: 'unexpected_result',
            });
            return false;
        }else{
            console.log(error)
        }
    });
});

module.exports = router;