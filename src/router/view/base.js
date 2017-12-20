const express = require('express');
const router = express.Router();
const fullurl = require('fullurl');
const Users = require('../../../schema/Users');
const Tracks = require('../../../schema/Tracks');
const randomstring = require('randomstring');
const parseDomain = require('parse-domain');


let socketConnection = {};
module.exports.socketConnection = socketConnection;

router.use('/render/oauth-app', require('./oAuthApp'));

router.all('/error/404', (req, res) => {
    res.send('<h1>404</h1><br><p>Page not find :/</p>')
});

module.exports = router;