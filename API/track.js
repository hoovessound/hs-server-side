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
const escape = require('escape-html');

async function authUser(res, token) {
    const user = await Users.findOne({token});
    return new Promise((ref, rej) => {
        if(user === null){
            const object = {
                error: true,
                msg: 'Can not find your token',
                code: 'token_not_found',
            };
            res.json(object);
            rej(object);
        }else{
            ref(user);
        }
    });
}

class FindTrack {

    constructor(res, token, req){
        this.res = res;
        this.token = token;
        this.req = req;
    }

    async findByUsernameAndTitle(username, title){
        try{
            const user = await authUser(this.res, this.token);
            if(user){
                const track = await Tracks.findOne({
                    'author.username': username,
                    title: title
                }, {
                    file: 0,
                });
                this.res.json(track);
            }
        }
        catch(error){
            console.log(error);
        }
    }

    async findById(id){
        try{
            const user = await authUser(this.res, this.token);
            if(user){
                const track = await Tracks.findOne({
                    _id: id,
                }, {
                    file: 0,
                })
                this.res.json(track);
            }
        }
        catch(error){
            console.log(error);
        }
    }

    async faveOrUnfave(id){

        try{
            let findFave = false;
            const user = await authUser(this.res, this.token);
            const full_address = this.req.protocol + "://" + this.req.headers.host;
            if(user){
                const track = await Tracks.findOne({_id: id});

                if (track === null) {
                    res.json({
                        error: true,
                        msg: 'Can not found your track',
                        code: 'missing_result_object',
                    })
                    return false;
                }else{
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

                    const updateFaveStatus = await Users.update({
                        _id: user._id,
                    }, user)
                    if(updateFaveStatus){
                        this.res.json({
                            faves: user.fave,
                            status,
                        });

                        request({
                            url: `${full_address}/api/notification`,
                            headers: {
                                token: this.token,
                            },
                            method: 'post',
                            json: true,
                            body: {
                                to: user._id,
                                title: 'Someone Has Liked Your Track',
                                body: `${user.username} Has Favorited Your Track`,
                                link: `${full_address}/track/${user.username}/${track.title}`,
                                icon: track.coverImage,
                            }
                        });
                    }

                }

            }
        }
        catch(error){
            console.log(error);
        }
    }

    async isFave(id){
        try{
            const user = await authUser(this.res, this.token);
            let findFave = false;
            if(user){
                const track = await Tracks.findOne({
                    _id: id,
                });

                if (track === null) {
                    this.res.json({
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
                    this.res.json({
                        fave: true,
                    })
                }else{
                    this.res.json({
                        fave: false,
                    })
                }

            }
        }
        catch(error){
            console.log(error);
        }
    }
}

router.get('/:username?/:title?', (req, res) => {
    const token = req.headers.token || req.query.token;
    const username = req.params.username || req.headers.username;
    const title = req.params.title || req.headers.title;
    const ID = req.query.id;
    const findTrack = new FindTrack(res, token);

    if(!ID){
        findTrack.findByUsernameAndTitle(username, title);
    }else{
        findTrack.findById(ID);
    }
});

router.post('/fave/:id?', (req, res) => {
    const id = req.params.id;
    const token = req.headers.token || req.query.token;
    const findTrack = new FindTrack(res, token, req);
    if (typeof id === 'undefined') {
        res.json({
            error: true,
            msg: 'Missing the id field',
            code: 'missing_require_fields',
        });
        return false;
    }
    findTrack.faveOrUnfave(id);
});

router.get('/fave/isfave/:id?', (req, res) => {
    const token = req.headers.token || req.query.token;
    const id = req.params.id;
    const findTrack = new FindTrack(res, token, req);
    if (typeof id === 'undefined') {
        res.json({
            error: true,
            msg: 'Missing the id field',
            code: 'missing_require_fields',
        });
        return false;
    }
    findTrack.isFave(id);
});

router.post('/edit/:id?', (req, res) => {
    const token = req.headers.token || req.query.token;
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
                                    track.title = `${escape(fields.title) || track.title}-private:${randomstring.generate(50)}`;
                                    writeDB();
                                    return false;
                                }

                                if(fields.description){
                                    track.description = escape(fields.description);
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