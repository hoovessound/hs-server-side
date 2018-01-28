const express = require('express');
const router = express.Router();
const Notification = require('../functions/notification');
const skygear = require('skygear');

router.post('/', (req, res) => {
    const notification = new Notification(req.hsAuth.user);
    notification.send(req.body)
    .then(data => {
        res.status(data.code);
        res.json({
            error: data.error,
        });
    })
    .catch(error => {
        console.log(error);
    });
});

router.delete('/', (req, res) => {
    const notification = new Notification(req.hsAuth.user);
    notification.delete(req.body.id)
    .then(data => {
        res.json(data);
    })
    .catch(error => {
        console.log(error);
    });
});

module.exports = router;