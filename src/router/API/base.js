const express = require('express');
const router = express.Router();
const cors = require('cors');
router.use(cors());

const csurf = require('csurf');

router.use(csurf());

router.use(function (err, req, res, next) {
    if (err.code !== 'EBADCSRFTOKEN') return next(err)
    // Someone just try to CSRF attack my app lol
    const links = [
        'https://www.youtube.com/watch?v=dv13gl0a-FA', // Deja Vu
        'https://www.youtube.com/watch?v=XCiDuy4mrWU', // Running in The 90s
        'https://www.youtube.com/watch?v=atuFSv2bLa8', // Gas Gas Gas
    ];
    const link = links[Math.floor(Math.random()*links.length)];
    res.redirect(link);
});

router.use('/tracks', require('../../../API/home'));

router.use('/me', require('../../../API/me'));

router.use('/auth/register', require('../../../API/auth/register'));

router.use('/auth/login', require('../../../API/auth/login'));

router.use('/auth/changepassword', require('../../../API/auth/changepassword'));

router.use('/upload', require('../../../API/upload'));

// cache for 1 year
router.use('/listen', require('../../../API/listen'));

router.use('/user', require('../../../API/user'));

router.use('/track', require('../../../API/track'));

router.use('/search', require('../../../API/search'));

router.use('/settings', require('../../../API/settings'));

router.use('/comment', require('../../../API/comment'));

router.use('/widget', require('../../../API/widget'));

router.use('/notification', require('./../../../API/notification'));

module.exports = router;