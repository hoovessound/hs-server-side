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
const escape = require('escape-html');

const TextFormattign = {
    url: (text) => {
        const regex = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9]\.[^\s]{2,})/igm;
        if(typeof text !== 'undefined' && text !== null){
            if(text.match(regex)){
                const url = text.match(regex);
                return text.replace(url, `<a href="${url}" target="_blank">${url}</a>`);
            }else{
                return text;
            }
        }
    }
}

router.get('/:id?', (req, res) => {
    const full_address = req.protocol + "://" + req.headers.host;
    if(!req.cookies['oauth-token']){
        res.end('Access denied');
    }else{
        const id = req.params.id;
        const token = req.cookies['oauth-token'];
        let _user;
        let comments = [];
        Users.findOne({
            token,
        })
        .then(user => {
            if(user === null){
                res.end('Access denied');
            }else{
                _user = user;
            }

            return Tracks.findOne({
                id,
            })
        })
        .then(track => {
            this.track = track;
            if(track === null){
                res.render('track', {
                    loginUser: _user,
                    track: null,
                    comments: null,
                    full_address,
                    token,
                    isFave: 'notFave',
                    error: `Can't not find your track :/`
                });
                return false;
            }
            // Find out if the user fave this track or not

            if(track.description){
                track.description = TextFormattign.url(track.description);
            }

            if(track.comments.length >= 1){
                track.comments.forEach((comment, index) =>{

                    // Find the user object
                    return Users.findOne({
                        id: comment.author,
                    })
                    .then(user => {
                        if(!user){
                            // Remove the comment
                            track.comments[index] = null;
                        }else{
                            // text formatting
                            this.track.comments[index].comment = TextFormattign.url(this.track.comments[index].comment);
                            this.track.comments[index].author = {
                                username: user.username,
                                fullName: user.fullName,
                            };
                        }
                        if(track.comments.length === (index + 1) ){
                            // Find the track author
                            renderPage();
                        }
                    })
                    .catch(error => {
                        console.log(error);
                    })

                });
            }else{
                renderPage();
            }

            function renderPage() {

                // Find the track author
                return Users.findOne({
                    id: track.author,
                })
                .then(trackAuthor => {

                    let isFave = 'isFave'
                    if(_user.fave.includes(track.id)){
                        isFave = 'isFave';
                    }else{
                        isFave = 'notFave';
                    }

                    if(trackAuthor){
                        track.author = {
                            username: trackAuthor.username,
                            fullName: trackAuthor.fullName,
                        };

                        res.render('track', {
                            loginUser: _user,
                            track,
                            comments: track.comments,
                            full_address,
                            token,
                            isFave,
                        });

                    }else{
                        res.render('track', {
                            loginUser: _user,
                            track: null,
                            comments: null,
                            full_address,
                            token,
                            isFave: 'notFave',
                            error: `Can't not find your track :/`
                        });
                        return false;
                    }
                })
                .catch(error => {
                    console.log(error);
                })
            }

        })
        .catch(error => {
            console.log(error);
        })
    }
});

router.get('/:username?/:title?/edit', (req, res) => {
    const full_address = req.protocol + "://" + req.headers.host;
    if(!req.cookies['oauth-token']){
        res.end('Access denied');
    }else{
        const username = req.params.username;
        const title = req.params.title;
        const token = req.cookies['oauth-token'];

        Users.findOne({
            token,
        }).then(user => {
            if(user === null){
                res.end('Access denied');
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
                res.end('Access denied');
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
                                let newTitle = escape(fields.title);
                                function writeDB() {
                                    if(fields.description){
                                        track.description = escape(fields.description);
                                    }

                                    return Tracks.update({
                                        _id: track._id
                                    }, track).then(() => {
                                        // Finish
                                        res.redirect(`/track/${req.params.username}/${track.title}?updating=true`);
                                        // Send a notification to the user
                                        return rp({
                                            url: `${full_address}/api/notification`,
                                            headers: {
                                                token,
                                            },
                                            method: 'post',
                                            json: true,
                                            body: {
                                                to: user._id,
                                                title: 'Track Is Edited!',
                                                body: `${track.title} Is Edited`,
                                                link: `${full_address}/track/${req.params.username}/${track.title}`,
                                            }
                                        })
                                    });
                                }

                                if(track.private){
                                    track.title = `${escape(fields.title) || track.title}-private:${randomstring.generate(50)}`;
                                    writeDB();
                                    return false;
                                }

                                if(fields.title){
                                    // Check if the new title match the old title
                                    if(fields.title !== track.title){
                                        // Is not the same
                                        return Tracks.findOne({
                                            title: escape(fields.title),
                                        }).then(authTrack => {
                                            if(authTrack !== null){
                                                    track.title = `${escape(fields.title)}(${randomstring.generate(10)})`;
                                            }else{
                                                track.title = escape(fields.title);
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
                                    return rp({
                                        url: `${full_address}/api/notification`,
                                        headers: {
                                            token,
                                        },
                                        method: 'post',
                                        json: true,
                                        body: {
                                            to: user._id,
                                            title: 'Track Is Edited I Guess :/',
                                            body: `Looks Like You Didn\'t Change A Bit Yet`,
                                            link: `${full_address}/track/${req.params.username}/${track.title}`,
                                        }
                                    })
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