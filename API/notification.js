const express = require('express');
const router = express.Router();
const Users = require('../schema/Users');
const randomstring = require('randomstring');

router.get('/', (req, res) => {
    const id = req.query.userid;
    Users.findOne({
        _id: id,
    })
    .then(user => {
        if (user === null) {
            res.json({
                error: true,
                msg: 'can\'t not find your user ID',
                code: 'unexpected_result',
            });
            return false;
        }else{
            // Find all the user's notification
            res.json({
                notifications: user.notification.reverse(),
            });
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
            console.log(error);
        }
    });
});

router.post('/', (req, res) => {
    const to = req.body.to;
    Users.findOne({
        _id: to,
    })
    .then(user => {
        if (user === null) {
            res.json({
                error: true,
                msg: 'can\'t not find your user ID',
                code: 'unexpected_result',
            });
            return false;
        }else{
            // Search for that user
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

router.post('/remove', (req, res) => {
    let id = req.body.userid;
    const notificationId = req.body.notificationId;
    let queryObject = {};
    if(req.query.bypass === 'true'){
        id = req.hsAuth.user._id;
        queryObject = {
            _id: req.hsAuth.user._id,
        }
    }else{
        queryObject = {
            _id: id,
        }
    }

    Users.findOne(queryObject)
    .then(user => {
        if (user === null) {
            res.json({
                error: true,
                msg: 'can\'t not find your user ID',
                code: 'unexpected_result',
            });
            return false;
        }else{
            // Find that notification id
            let findOne = false;
            user.notification.map(object => {
                if(object.id=== notificationId){
                    findOne = true;
                }
            })
            if(findOne){
                user.notification.splice(user.notification.indexOf(notificationId), 1);
                console.log(user.notification)
                return Users.update({
                    _id: id,
                }, user)
                .then(() => {
                    res.json({
                        status: 'removed',
                    });
                })
            }else{
                res.json({
                    error: true,
                    msg: 'can\'t not find your notification ID',
                    code: 'unexpected_result',
                });
                return false;
            }
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