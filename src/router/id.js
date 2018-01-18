const express = require('express');
const router = express.Router();
const csurf = require('csurf');
router.use(csurf());
router.use('/register', require('../../API/auth/register'));
router.use('/changepassword', require('../../API/auth/changepassword'));
router.use('/', require('../../API/auth/token/login'));
router.use('/login', require('../../API/auth/token/login'));
module.exports = router;