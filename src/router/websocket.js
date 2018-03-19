const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.end('it works lol') ;
});

module.exports = router;