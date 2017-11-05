const express = require('express');
const router = express.Router();
const cors = require('cors');
const limiter = require('express-better-ratelimit_hs_specific');

router.use('/widget', require('../../../API/widget'));

router.use('/oauth2/token/access', require('../../../API/auth/token/accessToken'));

// Third party oAuth
router.use('/oauth2/thirdparty/poniverse', require('../../../API/auth/thirdparty/poniverse'));
router.use('/oauth2/thirdparty/facebook', require('../../../API/auth/thirdparty/facebook'));

router.use(cors());

router.use(limiter({
    duration: 900000, // 15 min
    max: 500,
    accessLimited: {
        error: 'Too many request for this IP address, please read the API rate limit docs',
        code: 'service_lock_down',
    }
}));


router.use('/tracks', require('../../../API/home'));

router.use('/me', require('../../../API/me'));

router.use('/upload', require('../../../API/upload'));

router.use('/track', require('../../../API/track'));

router.use('/search', require('../../../API/search'));

router.use('/settings', require('../../../API/settings'));

router.use('/notification', require('./../../../API/notification'));

router.all('*', (req, res) => {
    res.json({
        error: 'API endpoint not found',
        docs_url: 'https://hoovessound.ml/developer/docs',
    });
});

module.exports = router;