const express = require('express');
const router = express.Router();

router.use('/', require('../../../API/auth/token/tempToken'));
router.use('/login', require('../../../API/auth/token/tempToken'));
router.use('/register', require('../../../API/auth/register'));
router.use('/changepassword', require('../../../API/auth/changepassword'));

module.exports = router;