const express = require('express');
const router = express.Router();
router.get('/', (req, res) => {
    // For the backward compatibility reason
    const rawQuery = require('url').parse(req.url).query;
    res.redirect(`/api/oauth1/token/temporary?${rawQuery}`);
});
module.exports = router;