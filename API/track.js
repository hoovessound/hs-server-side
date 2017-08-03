const express = require('express');
const router = express.Router();
const Tracks = require('../schema/Tracks');
const Users = require('../schema/Users');
const mongoose = require('mongoose');
let status;
const formidable = require('formidable');
const path = require('path');
const gcs = require('@google-cloud/storage')({
    projectId: 'hoovessound',
    keyFilename: require('../src/index').gcsPath,
});
const sha256 = require('sha256');
const randomstring = require('randomstring');
const fsp = require('fs-promise');
const easyimage = require('easyimage');
const request = require('request');

router.get('/:username?/:title?', (req, res) => {
    const full_address = req.protocol + "://" + req.headers.host;
    const token = req.body.token || req.headers.token || req.query.token;
    const username = req.params.username || req.headers.username;
    const title = req.params.title || req.headers.title;
    const ID = req.query.id;
    Users.findOne({
        token: token,
    })
    .then(user => {
        if(user === null){
            res.json({
                error: true,
                msg: 'Can not find your token',
                code: 'token_not_found',
            });
            return false;
        }else{

            if(ID){
                return Tracks.findOne({
                    _id: ID,
                }, {
                    file: 0,
                })
                .then(track => {
                    res.json(track);
                });
            }else{
                return Tracks.findOne({
                    'author.username': username,
                    title: title
                }, {
                    file: 0,
                })
                .then(track => {
                    res.json(track);
                });
            }
        }
    })
    .catch(error => {
        if(error.message.includes('Cast to ObjectId failed for value')){
            res.json({
                error: true,
                msg: 'Can\'t not found your track',
                code: 'unexpected_result',
            });
            return false;
        }else{
            console.log(error)
        }
    })
});

router.post('/fave/:id?', (req, res) => {
    const id = req.params.id;
    const token = req.body.token || req.headers.token || req.query.token;
    let findFave = false;
    if (typeof id === 'undefined') {
        res.json({
            error: true,
            msg: 'Missing the id field',
            code: 'missing_require_fields',
        });
        return false;
    }
    Users.findOne({
        token,
    })
    .then(user => {
        if (user === null) {
            res.json({
                error: true,
                msg: 'Can not find your token',
                code: 'token_not_found',
            });
            return false;
        } else {
            this.user = user;
            return Tracks.findOne({
                _id: id,
            })
            .then(track => {
                if (track === null) {
                    res.json({
                        error: true,
                        msg: 'Can not found your track',
                        code: 'missing_result_object',
                    })
                    return false;
                }
                // If the user already fave the track, just remove it, if not add one
                user.fave.forEach(id => {
                    if (id == track._id.toString()) {
                        findFave = true;
                    }
                });

                if (findFave) {
                    // Remove it
                    user.fave.splice(user.fave.indexOf(track._id.toString()), 1);
                    status = 'removed';
                } else {
                    user.fave.push(track._id);
                    status = 'added';
                }
                return Users.update({
                    _id: this.user._id,
                }, user)
                .then(afterUpdate => {
                    res.json({
                        faves: user.fave,
                        status,
                    })
                })
            });
        }
    })
    .catch(error => {
        if(error.message.includes('Cast to ObjectId failed for value')){
            res.json({
                error: true,
                msg: 'Can\'t not found your track',
                code: 'unexpected_result',
            });
            return false;
        }else{
            console.log(error)
        }
    })
});

router.get('/fave/isfave/:id?', (req, res) => {
    const token = req.body.token || req.headers.token || req.query.token;
    const id = req.params.id;
    let findFave = false;
    if (typeof id === 'undefined') {
        res.json({
            error: true,
            msg: 'Missing the id field',
            code: 'missing_require_fields',
        });
        return false;
    }

    Users.findOne({
        token,
    })
    .then(user => {
        if (user === null) {
            res.json({
                error: true,
                msg: 'Can not find your token',
                code: 'token_not_found',
            });
            return false;
        } else {
            this.user = user;
            return Tracks.findOne({
                _id: id,
            })
            .then(track => {
                if (track === null) {
                    res.json({
                        error: true,
                        msg: 'Can not found your track',
                        code: 'missing_result_object',
                    })
                    return false;
                }
                // If the user already fave the track, just remove it, if not add one
                user.fave.forEach(faveStackID => {
                    if (faveStackID.toString() == id) {
                        findFave = true;
                    }
                });

                if (findFave) {
                    res.json({
                        fave: true,
                    })
                }else{
                    res.json({
                        fave: false,
                    })
                }
            });
        }
    })
    .catch(error => {
        if(error.message.includes('Cast to ObjectId failed for value')){
            res.json({
                error: true,
                msg: 'Can\'t not found your track',
                code: 'unexpected_result',
            });
            return false;
        }else{
            console.log(error)
        }
    })
});

router.post('/edit/:id?', (req, res) => {
    const token = req.body.token || req.headers.token || req.query.token;
    const id = req.params.id;
    const full_address = req.protocol + "://" + req.headers.host;
    if (typeof id === 'undefined') {
        res.json({
            error: true,
            msg: 'Missing the id field',
            code: 'missing_require_fields',
        });
        return false;
    }

    Users.findOne({
        token,
    }).then(user => {
        if (user === null) {
            res.json({
                error: true,
                msg: 'Can not find your token',
                code: 'token_not_found',
            });
            return false;
        }else{
            // Check if the track exist
            return Tracks.findById(id, {
                file: 0,
            }).then(track => {
                if(track.author.username !== user.username){
                    res.json({
                        error: true,
                        msg: 'You are unauthorized to perform this action',
                        code: 'unauthorized_action',
                    });
                    return false;
                }else{
                    const form = formidable.IncomingForm({
                        uploadDir: path.join(`${__dirname}/../usersContent`),
                    });
                    form.encoding = 'utf-8';
                    form.parse(req, (error, fields, files) => {
                        if (error) {
                            console.log(error);
                        } else {
                            if(fields.private === 'true'){
                                track.private = true;
                            }else{
                                track.private = false;
                            }
                            
                            // Check if the user submit an cover image
                            if(files.image){
                                if(files.image.size > 0){
                                    if(!files.image.type.includes('image')){
                                        res.json({
                                            error: true,
                                            msg: 'File is not an image type',
                                            code: 'not_valid_file_type',
                                        });
                                        return false;
                                    }else{
                                        const ext = path.extname(files.image.name);
                                        const newID = sha256(randomstring.generate(10));
                                        let fileID = newID + ext;
                                        const coverImagePath = path.join(`${__dirname}/../usersContent/${fileID}`);
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

                                function writeDB() {
                                    return Tracks.update({
                                        _id: track._id
                                    }, track).then(() => {
                                        // Finish
                                        res.json({
                                            track,
                                        });
                                    });
                                }

                                if(track.private){
                                    track.title = `${fields.title || track.title}-private:${randomstring.generate(50)}`;
                                    writeDB();
                                    return false;
                                }

                                if(fields.description){
                                    track.description = fields.description;
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
                                        return false;
                                    }
                                }
                                if(!fields.title && !fields.image && !fields.description){
                                    res.json({
                                        error: true,
                                        msg: 'You have to pass in one or more argument',
                                        code: 'missing_require_fields',
                                    });
                                    return false;
                                }else{
                                    writeDB();
                                }
                            }

                        }
                    });
                }
            })
        }
    }).catch(error => {
        if(error.message.includes('Cast to ObjectId failed for value')){
            res.json({
                error: true,
                msg: 'Can\'t not found your track',
                code: 'unexpected_result',
            });
            return false;
        }else{
            console.log(error)
        }
    });
});

module.exports = router;