const express = require('express');
const router = express.Router();
const Users = require('../schema/Users');
const genId = require('../src/helper/genId');

router.get('/', (req, res) => {
    res.json({
        notifications: req.hsAuth.user.notification.reverse(),
    });
});

router.post('/', (req, res) => {
    const to = req.body.to;
    Users.findOne({
        id: to,
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
            // Settings up the user's notification stack
            let payload = req.body;
            const date = new Date();
            const ID = genId(40);
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
                if(typeof req.body.push === 'undefined'){
                    payload.push = true;
                }else{
                    payload.push = req.body.push;
                }
                res.io.emit('notification:new', payload);
                delete payload.push;
                res.json(payload);
            })
        }
    })
    .catch((error) => {
        console.log(error);
    });
});

router.delete('/:notificationId', (req, res) => {
    const notificationId = req.params.notificationId;
    const user = req.hsAuth.user;

    // Find that notification id
    let findIt = false;
    let notificationIndex;

    user.notification.forEach(notifyObject => {
        if(notifyObject.id === notificationId){
            findIt = true;
        }
    })

    if(findIt){
        user.notification.splice(notificationIndex, 1);
        return Users.update({
            _id: user._id,
        }, user)
        .then(() => {
            res.json({
                status: 'removed',
            });
        })
    }else{
        res.json({
            error: 'can\'t not find your notification ID',
            code: 'unexpected_result',
        });
        return false;
    }

});

module.exports = router;