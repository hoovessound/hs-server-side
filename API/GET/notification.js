const express = require('express');
const router = express.Router();
const Notification = require('../functions/notification');

router.get('/', (req, res) => {
    const notification = new Notification(req.hsAuth.user);
    notification.get(req.query.read)
    .then(data => {
        res.json(data);
    })
    .catch(error => {
        console.log(error);
    });
})

module.exports = router;