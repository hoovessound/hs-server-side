const express = require('express');
const router = express.Router();
const Notification = require('../functions/notification');

router.post('/', (req, res) => {
    const notification = new Notification(req.hsAuth.user);
    notification.send(req.body)
    .then(data => {
        res.json(data);
    })
    .catch(error => {
        console.log(error);
    });
})

router.delete('/', (req, res) => {
    const notification = new Notification(req.hsAuth.user);
    notification.delete(req.body.id)
    .then(data => {
        res.json(data);
    })
    .catch(error => {
        console.log(error);
    });
})

module.exports = router;