const express = require('express');
const router = express.Router();
const oAuthApps = require('../../../schema/oAuthApps');
const TempTokes = require('../../../schema/TempTokes');
const Doodles = require('../../../schema/Doodles');
const csurf = require('csurf');
router.use(csurf());
router.use('/register', require('../../../API/auth/register'));
router.use('/changepassword', require('../../../API/auth/changepassword'));
router.use('/', require('../../../API/auth/token/tempToken'));
router.use('/login', require('../../../API/auth/token/tempToken'));
module.exports = router;