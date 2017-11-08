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
const moment = require('moment');

class FindTrack {

    constructor(res, req){
        this.res = res;
        this.req = req;
    }

    async findById(id){
        try{
            const track = await Tracks.findOne({
                id,
            }, {
                file: 0,
                __v: 0,
                _id: 0,
                comments: 0,
            })

            if(!this.req.query.bypass){
                if(track.private){
                    // Check permission
                    if(!this.req.hsAuth.app.permission.includes('private_track')){
                        this.res.json({
                            error: 'Bad permission scoping',
                            code: 'service_lock_down',
                        });
                        return false;
                    }
                }
            }

            if(!track){
                this.res.json({
                    error: 'Can\'t not that track id',
                    code: 'unexpected_result',
                });
                return false;
            }

            this.res.json(track);
        }
        catch(error){
            console.log(error)
        }
    }

    async faveOrUnfave(id){

        try{

            // Check permission
            const user = this.req.hsAuth.user;

            if(!this.req.query.bypass){
                if(!this.req.hsAuth.app.permission.includes('post_comment')){
                    this.res.json({
                        error: 'Bad permission scoping',
                        code: 'service_lock_down',
                    });
                    return false;
                }
            }

            const authArgument = this.req.body.userid || this.req.headers.token;
            const bypass = this.req.query.bypass;

            const full_address = this.req.protocol + "://" + this.req.headers.host;
            const track = await Tracks.findOne({id: this.req.params.id});

            if (track === null) {
                this.res.json({
                    error: 'Can not found your track',
                    code: 'missing_result_object',
                })
                return false;
            }else{
                // If the user already fave the track, just remove it, if not add one

                if(user.fave.includes(id)){
                    // Remove it
                    user.fave.splice(user.fave.indexOf(track.id.toString()), 1);
                    status = 'removed';
                }else{
                    user.fave.push(track.id);
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
                            to: user.id,
                            title: 'Someone Has Liked Your Track',
                            body: `${user.username} Has Favorited Your Track`,
                            link: `${full_address}/track/${user.username}/${track.title}`,
                            icon: track.coverImage,
                        }
                    });
                }

            }
        }
        catch(error){
            console.log(error)
        }
    }

    async getComment(trackId){
        try{
            const track = await Tracks.findOne({
                id: trackId,
            })

            if(!track){
                this.res.json({
                    error: 'Can\'t not that track id',
                    code: 'unexpected_result',
                });
                return false;
            }

            this.res.json(track.comments);
        }
        catch(error){
            console.log(error)
        }
    }

    async addComment(trackId){

        // Check permission

        if(!this.req.query.bypass){
            if(!this.req.hsAuth.app.permission.includes('post_comment')){
                this.res.json({
                    error: 'Bad permission scoping',
                    code: 'service_lock_down',
                });
                // return false;
            }
        }

        try{
            const track = await Tracks.findOne({
                id: trackId,
            })

            if(!track){
                this.res.json({
                    error: 'Can\'t not that track id',
                    code: 'unexpected_result',
                });
                return false;
            }

            const comment = escape(this.req.body.comment);

            const commentObject = {
                author: this.req.hsAuth.user.id,
                postDate: moment()._d,
                comment: comment,
            };
            track.comments.push(commentObject);
            await Tracks.update({
                _id: trackId,
            }, track);

            this.res.json({
                commentObject,
                author: {
                    username: this.req.hsAuth.user.username,
                    fullName: this.req.hsAuth.user.fullName,
                },
            });
        }
        catch(error){
            console.log(error);
        }
    }

}

router.get('/:id', (req, res) => {
    const ID = req.params.id;
    const findTrack = new FindTrack(res,req);
    if(!ID){
        res.json({
            error: true,
            msg: 'Missing the ID field',
            code: 'missing_require_fields',
        });
        return false;
    }
    findTrack.findById(ID);
});

router.post('/fave/:id?', (req, res) => {
    const id = req.params.id;
    const findTrack = new FindTrack(res, req);
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

router.post('/edit/:id?', (req, res) => {
    const id = req.params.id;
    if (!id) {
        res.json({
            error: true,
            msg: 'Missing the trackid field',
            code: 'missing_require_fields',
        });
        return false;
    }
    
    const form = formidable.IncomingForm({
        uploadDir: path.join(`${__dirname}/../usersContent`),
    });
    form.encoding = 'utf-8';
    form.parse(req, (error, fields, files) => {
        if (error) {
            console.log(error);
        } else {

            if(req.query.bypass){
                fields.userid = req.hsAuth.user._id;
            }

            const user = req.hsAuth.user;

            console.log(fields)

            // Check if the track exist
            return Tracks.findOne({
                id,
            }, {
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

                    if(!req.query.bypass){
                        if(track.private){
                            // Check permission
                            if(!req.hsAuth.app.permission.includes('private_track')){
                                res.json({
                                    error: 'Bad permission scoping',
                                    code: 'service_lock_down',
                                });
                                return false;
                            }
                        }else{
                            if(!req.hsAuth.app.permission.includes('edit_track')){
                                res.json({
                                    error: 'Bad permission scoping',
                                    code: 'service_lock_down',
                                });
                                return false;
                            }
                        }
                    }

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
                                            return file.makePublic()
                                            .then(url => {
                                                coverImage = url[0];
                                                fsp.unlinkSync(coverImagePath);
                                                track.coverImage = `https://storage.googleapis.com/hs-cover-image/${fileID}`;
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
                                    id: track.id,
                                    title: track.title,
                                    uploadDate: track.uploadDate,
                                    description: track.description,
                                    private: track.private,
                                    coverImage: track.coverImage,
                                    author: {
                                        username: track.author.username,
                                        fullName: track.author.fullName,
                                    }
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
            })

        }
    });
});

router.get('/comment/:id?', (req, res) => {
    const trackid = req.params.id;
    const findTrack = new FindTrack(res, req);
    if (!trackid) {
        res.json({
            error: true,
            msg: 'Missing the trackid field',
            code: 'missing_require_fields',
        });
        return false;
    }
    findTrack.getComment(trackid);
});

router.post('/comment/:id?', (req, res) => {
    const trackid = req.params.id;
    const findTrack = new FindTrack(res, req);
    if (!trackid) {
        res.json({
            error: 'Missing the trackid field',
            code: 'missing_require_fields',
        });
        return false;
    }

    if(!req.body.comment) {
        res.json({
            error: 'Missing the comment field',
            code: 'missing_require_fields',
        });
        return false;
    }

    findTrack.addComment(trackid);
});

module.exports = router;