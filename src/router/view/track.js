import express from 'express';
const router = express.Router();
import rp from 'request-promise';
import fullurl from 'fullurl';
import Users from '../../../schema/Users';
import Tracks from '../../../schema/Tracks';
import formidable from 'formidable';
import path from 'path';
const gcs = require('@google-cloud/storage')({
    projectId: 'hoovessound',
    keyFilename: require('../../index').gcsPath,
});
import sha256 from 'sha256';
import randomstring from 'randomstring';
import fsp from 'fs-promise';
import easyimage from 'easyimage';

const TextFormattign = {
    url: (text) => {
        const regex = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9]\.[^\s]{2,})/igm;
        if(typeof text !== 'undefined'){
            if(text.match(regex)){
                const url = text.match(regex);
                return text.replace(url, `<a href="${url}" target="_blank">${url}</a>`);
            }else{
                return text;
            }
        }
    }
}

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

                track.description = TextFormattign.url(track.description);

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

                            // text formatting
                            comment.comment = TextFormattign.url(comment.comment);
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