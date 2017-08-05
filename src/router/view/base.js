const express = require('express');
const router = express.Router();
const Users = require('../../../schema/Users');
const Tracks = require('../../../schema/Tracks');
const fullurl = require('fullurl');
const randomstring = require('randomstring');
let socketConnection = {};
module.exports.socketConnection = socketConnection;

router.use('/render/track', require('./track'));

router.use('/render/upload', require('./upload'));

router.use('/render/me', require('./me'));

router.use('/render/user', require('./user'));

router.use('/render/search', require('./search'));

router.use('/render/settings', require('./settings'));

router.use('/render/tracks', require('./latesetTracks'));

router.use('/render/notification', require('./notification'));

router.get('*', (req, res) => {
    const full_address = req.protocol + "://" + req.headers.host;
    const token = req.cookies['oauth-token'];
    if(!req.cookies['oauth-token']){
        res.redirect('/api/auth/login?redirect=' + fullurl(req));
    }else{
        Users.findOne({
            token: token,
        }).then(user => {
            if (user === null) {
                res.redirect('/api/auth/login?redirect=' + fullurl(req));
                return false;
            } else {

                return Tracks.findOne({
                    $or: [
                        {
                            private: false,
                        },
                        {
                            private: {
                                $exists: false,
                            }
                        }
                    ]
                }).limit(1).sort({
                    uploadDate: -1
                }).then(track => {

                    // Save the current user socket to the Db
                    res.io.on('connection', function(socket){
                        // Save the connectionID to the user DB
                        user.socket.push(socket.id);

                        // Save the socket to the socketConnection object
                        socketConnection[socket.id] = socket;
                        module.exports.socketConnection = socketConnection;
                        // Save the connectionID to the user DB
                        Users.update({
                            _id: user._id,
                        }, user)
                        .catch(error => {
                            console.log(error);
                        })

                        socket.on('disconnect', function(){
                            // Remove the socket ID from the current session
                            delete socketConnection[socket.id];
                            module.exports.socketConnection = socketConnection;
                            // Update the user's socket stack
                            user.socket.splice(user.socket.indexOf(socket.id), 1);
                            Users.update({
                                _id: user._id,
                            }, user)
                            .catch(error => {
                                console.log(error);
                            })
                        });

                        // Auto socket clean up (10 min)
                        setTimeout(() => {
                            Users.findOne({
                                _id: user._id,
                            })
                            .then(cleanUpUser => {
                                cleanUpUser.socket.forEach(id => {
                                    if(typeof socketConnection[id] === 'undefined'){
                                        cleanUpUser.socket.splice(cleanUpUser.socket.indexOf(id), 1);
                                        Users.update({
                                            _id: cleanUpUser._id,
                                        }, cleanUpUser)
                                        .catch(error => {
                                            console.log(error);
                                        })
                                    }
                                })
                            })
                            .catch(error => {
                                console.log(error);
                            })
                        },600000);


                    });

                    res.render('index', {
                        loginUser: user,
                        track,
                        full_address,
                        token,
                        totalPage: 0,
                        offset: 10,
                        isFave: false,
                    });
                })
            }
        })
        .catch(error => {
            console.log(error);
        });
    }
});

module.exports = router;