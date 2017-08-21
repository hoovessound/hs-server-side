import express from 'express';
const router = express.Router();

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