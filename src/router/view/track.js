const express = require('express');
const router = express.Router();
const rp = require('request-promise');
const fullurl = require('fullurl');
const Users = require('../../../schema/Users');
const Tracks = require('../../../schema/Tracks');
const formidable = require('formidable');
const path = require('path');
const gcs = require('@google-cloud/storage')({
    projectId: 'hoovessound',
    keyFilename: require('../../index').gcsPath,
});
const sha256 = require('sha256');
const randomstring = require('randomstring');
const fsp = require('fs-promise');
const easyimage = require('easyimage');

router.get('/:username?/:title?', (req, res) => {
    const full_address = req.protocol + "://" + req.headers.host;
    if(!req.cookies['oauth-token']){
        res.redirect('/api/auth/login?redirect=' + fullurl(req));
    }else{
        const username = req.params.username;
        const title = req.params.title;
        const token = req.cookies['oauth-token'];

        Users.findOne({
            token,
        }).then(user => {
            if(user === null){
                res.redirect('/api/auth/login?redirect=' + fullurl(req));
            }
            return Tracks.findOne({
                'author.username': username,
                title: title,
            }).then(track => {
                // Find out if the user fave this track or not
                return rp.get({
                    url: `${full_address}/api/track/fave/isfave/${track._id}`,
                    headers: {
                        token,
                    }
                }).then(isFave => {
                    isFave = JSON.parse(isFave);
                    if(track.comments.length >= 1){
                        let comments = [];
                        track.comments.forEach(comment =>{
                            // Find the user object
                            return Users.findOne({
                                _id: comment.author,
                            }, {
                                username: 1,
                                fullName: 1,
                            }).then(commentUser => {
                                comments.push({
                                    author: {
                                        username: commentUser.username,
                                        fullName: commentUser.fullName,
                                    },
                                    comment: comment.comment,
                                });
                                if(comments.length === track.comments.length){
                                    res.render('track', {
                                        loginUser: user,
                                        track,
                                        comments,
                                        full_address,
                                        token,
                                        isFave: isFave.fave ? 'isFave': 'notFave',
                                    });
                                }
                            });
                        });
                    }else{
                        res.render('track', {
                            loginUser: user,
                            track,
                            comments: [],
                            full_address,
                            token,
                            isFave: isFave.fave ? 'isFave': 'notFave',
                            error: null,
                        });
                    }
                })
            });
        }).catch(error => {
            console.log(error);
        })
    }
});

router.get('/:username?/:title?/edit', (req, res) => {
    const full_address = req.protocol + "://" + req.headers.host;
    if(!req.cookies['oauth-token']){
        res.redirect('/api/auth/login?redirect=' + fullurl(req));
    }else{
        const username = req.params.username;
        const title = req.params.title;
        const token = req.cookies['oauth-token'];

        Users.findOne({
            token,
        }).then(user => {
            if(user === null){
                res.redirect('/api/auth/login?redirect=' + fullurl(req));
            }

            if(req.params.username !== user.username){
                res.send('<h1>You don\'t have access to that</h1>');
                return false;
            }

            return Tracks.findOne({
                'author.username': username,
                title: title,
            }).then(track => {
                if(track === null){
                    res.render('editTrack', {
                        loginUser: user,
                        token,
                        full_address,
                        error: 'Can not found your track :/'
                    });
                }else{
                    res.render('editTrack', {
                        loginUser: user,
                        full_address,
                        token,
                        track,
                        error: false,
                    });
                }
            });
        }).catch(error => {
            console.log(error);
        })
    }
});

router.post('/:username?/:title?/edit', (req, res) => {
    const full_address = req.protocol + "://" + req.headers.host;
    if(!req.cookies['oauth-token']){
        res.redirect('/api/auth/login?redirect=' + fullurl(req));
    }else{
        const username = req.params.username;
        const title = req.params.title;
        const token = req.cookies['oauth-token'];

        Users.findOne({
            token,
        }).then(user => {
            if(user === null){
                res.redirect('/api/auth/login?redirect=' + fullurl(req));
            }

            if(req.params.username !== user.username){
                res.redirect(`/track/${req.params.username}/${req.params.title}`);
                return false;
            }

            return Tracks.findOne({
                'author.username': username,
                title: title,
            }).then(track => {
                if(track === null){
                    res.redirect('/');
                }else{

                    const form = formidable.IncomingForm({
                        uploadDir: path.join(`${__dirname}/../../usersContent`),
                    });
                    form.encoding = 'utf-8';
                    form.parse(req, (error, fields, files) => {
                        if (error) {
                            console.log(error);
                        } else {

                            if(fields.private === 'on'){
                                track.private = true;
                            }else{
                                track.private = false;
                            }

                            // Check if the user submit an cover image
                            if(files.image){
                                if(files.image.size > 0){
                                    if(!files.image.type.includes('image')){
                                        res.render('editTrack', {
                                            loginUser: user,
                                            full_address,
                                            token,
                                            track,
                                            error: 'File is not an image type',
                                        });
                                    }else{
                                        const ext = path.extname(files.image.name);
                                        const newID = sha256(randomstring.generate(10));
                                        let fileID = newID + ext;
                                        const coverImagePath = path.join(`${__dirname}/../../usersContent/${fileID}`);
                                        const gcsCoverImage = gcs.bucket('hs-cover-image');
                                        fsp.rename(files.image.path, coverImagePath).then(() => {

                                            // Resize the image first
                                            return easyimage.resize({
                                                src: coverImagePath,
                                                dst: coverImagePath,
                                                width: 500,
                                                height: 500,
                                                ignoreAspectRatio: true,
                                            }).then(processedImage => {
                                                return gcsCoverImage.upload(coverImagePath).then(file => {
                                                    file = file[0];
                                                    return file.getSignedUrl({
                                                        action: 'read',
                                                        expires: '03-09-2491',
                                                    }).then(url => {
                                                        coverImage = url[0];
                                                        fsp.unlinkSync(coverImagePath);
                                                        track.coverImage = coverImage;
                                                        updateTitle();
                                                    })
                                                })
                                            });
                                        }).catch(error => {
                                            console.log(error);
                                        });
                                    }
                                }else{
                                    updateTitle();
                                }
                            }else{
                                updateTitle();
                            }

                            function updateTitle() {
                                let newTitle = fields.title;
                                function writeDB() {
                                    if(fields.description){
                                        track.description = fields.description;
                                    }

                                    return Tracks.update({
                                        _id: track._id
                                    }, track).then(() => {
                                        // Finish
                                        res.redirect(`/track/${req.params.username}/${track.title}?updating=true`);
                                    });
                                }

                                if(track.private){
                                    track.title = `${fields.title || track.title}-private:${randomstring.generate(50)}`;
                                    writeDB();
                                    return false;
                                }

                                if(fields.title){
                                    // Check if the new title match the old title
                                    if(fields.title !== track.title){
                                        // Is not the same
                                        return Tracks.findOne({
                                            title: fields.title,
                                        }).then(authTrack => {
                                            if(authTrack !== null){
                                                    track.title = `${fields.title}(${randomstring.generate(10)})`;
                                            }else{
                                                track.title = fields.title;
                                            }
                                            writeDB();
                                        });
                                    }else{
                                        // Same title
                                        writeDB();
                                    }
                                }else{
                                    // Didn't pass anything at all :/
                                    res.redirect(`/track/${req.params.username}/${track.title}?updating=true`);
                                }
                            }
                        }
                    });
                }
            });
        }).catch(error => {
            console.log(error);
        })
    }
});

module.exports = router;