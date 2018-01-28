const express = require('express');
const router = express.Router();
const Tracks = require('../../schema/Tracks');
const Users = require('../../schema/Users');
const Tags = require('../../schema/Tags');
const Doodles = require('../../schema/Doodles');
let status;
const formidable = require('formidable');
const path = require('path');
const gcs = require('@google-cloud/storage')({
    projectId: 'hoovessound',
    keyFilename: require('../../src/index').gcsPath,
});
const sha256 = require('sha256');
const randomstring = require('randomstring');
const fsp = require('fs-promise');
const easyimage = require('easyimage');
const request = require('request');
const escape = require('escape-html');
const moment = require('moment');
const escapeHtml = require('escape-html');
const genId = require('../../src/helper/genId');

class FindTrack {

    constructor(res, req){
        this.res = res;
        this.req = req;
    }

    async faveOrUnfave(id){

        try{

            // Check permission
            const user = this.req.hsAuth.user;

            const authArgument = this.req.body.userid || this.req.headers.token;
            const bypass = this.req.query.bypass;

            const full_address = this.req.protocol + "://" + this.req.headers.host;
            const track = await Tracks.findOne({id: this.req.params.id});

            if (track === null) {
                res.status(403);
                this.res.json({
                    error: 'Can not found your track',
                });
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
                }

            }
        }
        catch(error){
            console.log(error)
        }
    }

    async addComment(trackId){

        // Check permission

        if(!this.req.query.bypass){
            if(!this.req.hsAuth.app.permission.includes('post_comment')){
                res.status(401);
                this.res.json({
                    error: 'Bad permission scoping',
                });
                return false;
            }
        }

        try{
            const track = await Tracks.findOne({
                id: trackId,
            })

            if(!track){
                res.status(403);
                this.res.json({
                    error: 'Can not not that track id',
                });
                return false;
            }

            const comment = escape(this.req.body.comment);

            const commentObject = {
                id: genId(),
                author: this.req.hsAuth.user.id,
                postDate: moment()._d,
                comment: comment,
            };
            track.comments.push(commentObject);
            await Tracks.update({
                id: trackId,
            }, track);

            this.res.json({
                id: genId(),
                postDate: moment()._d,
                comment: comment,
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

    async removeTag(track, tag){
        const req = this.req;
        const res = this.res;
        const trackId = track.id;
        // Remove the tag form the track job
        if(track.tags.includes(tag)){
            track.tags.splice(track.tags.indexOf(tag), 1);
        }
        // Update the tag registry
        const tags = await Tags.findOne({
            name: tag,
        });
        tags.tracks.splice(tags.tracks.indexOf(track.id), 1);
        await Promise.all([
            Tracks.update({_id: track._id}, track),
            Tags.update({_id: tags._id}, tags),
        ]);
        res.json({
            tag,
            message: 'success',
        });
    }

    async updateBackgroundDrop(){
        const req = this.req;
        const res = this.res;
        const user = req.hsAuth.user;
        const doodle = await Doodles.findOne({
            author: user.id,
        });
        if(!doodle){
            res.status(403);
            res.json({
                error: 'Doodle does not exits',
            });
            return false;
        }

        const track = await Tracks.findOne({
            id: req.params.id,
        });

        if(!track){
            res.status(403);
            res.json({
                error: 'Track does not exits',
            });
            return false;
        }

        track.backgrounddrop = doodle.id;

        await Tracks.update({_id: track._id}, track);
        res.json({
            success: true,
        });

    }
}

router.post('/favorite/:id?', (req, res) => {
    const id = req.params.id;
    const findTrack = new FindTrack(res, req);
    if (typeof id === 'undefined') {
        res.status(403);
        res.json({
            error: 'Missing the id field',
        });
        return false;
    }
    findTrack.faveOrUnfave(id);
});

router.post('/edit/:id?', (req, res) => {

    const id = req.params.id;
    if (!id) {
        res.status(403);
        res.json({
            error: 'Missing the trackid field',
        });
        return false;
    }
    
    const form = formidable.IncomingForm({
        uploadDir: path.join(`${__dirname}/../../../usersContent`),
    });
    form.encoding = 'utf-8';
    form.parse(req, (error, fields, files) => {
        if (error) {
            console.log(error);
        } else {

            fields.userid = req.hsAuth.user._id;

            const user = req.hsAuth.user;

            // Check if the track exist
            return Tracks.findOne({
                id,
            })
            .then(track => {

                if(!track){
                    res.status(403);
                    res.json({
                        error: 'can not not find your track',
                    });
                    return false;
                }
                if(track.author !== user.id){
                    res.status(403);
                    res.json({
                        error: 'You are unauthorized to perform this action',
                    });
                    return false;
                }else{
                    if(!req.query.bypass){
                        if(track.private){
                            // Check permission
                            if(!req.hsAuth.app.permission.includes('private_track')){
                                res.status(401);
                                res.json({
                                    error: 'Bad permission scoping',
                                });
                                return false;
                            }
                        }else{
                            if(!req.hsAuth.app.permission.includes('edit_track')){
                                res.status(401);
                                res.json({
                                    error: 'Bad permission scoping',
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
                                res.status(403);
                                res.json({
                                    error: 'File is not an image type',
                                });
                                return false;
                            }else{
                                const ext = path.extname(files.image.name);
                                const newID = sha256(randomstring.generate(10));
                                let fileID = newID + ext;
                                const coverImagePath = path.join(`${__dirname}/../../../usersContent/${fileID}`);
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
                                    description: track.description,
                                    private: track.private,
                                    coverImage: track.coverImage,
                                });
                            });
                        }

                        if(track.private){
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
                            res.status(403);
                            res.json({
                                error: 'You have to pass in one or more argument',
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

router.post('/backgrounddrop/:id?', (req, res) => {
    const findTrack = new FindTrack(res, req);
    findTrack.updateBackgroundDrop(req, res);
});

router.post('/comment/:id?', (req, res) => {
    const trackid = req.params.id;
    const findTrack = new FindTrack(res, req);
    if (!trackid) {
        res.status(403);
        res.json({
            error: 'Missing the trackid field',
        });
        return false;
    }

    if(!req.body.comment) {
        res.status(403);
        res.json({
            error: 'Missing the comment field',
        });
        return false;
    }

    findTrack.addComment(trackid);
});

router.post('/tag/:trackid?', (req, res) => {
    const user = req.hsAuth.user;
    let tag = req.body.tag;
    tag = escapeHtml(tag);
    tag = tag.replace(/ /g, '_');
    tag = tag.replace(/[^a-zA-Z0-9_]/g, '');
    // Find the track
    Tracks.findOne({
        id: req.params.trackid,
    })
    .then(track => {
        if(!track){
            res.status(403);
            res.json({
                error: 'Can not not that track id',
            });
            return false;
        }else{

            if(track.author !== user.id){
                res.status(401);
                res.json({
                    error: 'You are unauthorized to perform this action',
                });
                return false;
            }

            if(!track.tags.includes(tag)){
                track.tags.push(tag);
                return Tracks.update({
                    _id: track._id,
                }, track)
            }else{
                res.json({
                    tag,
                    message: 'Success',
                    trackId: req.params.trackid,
                })
            }
        }
    })
    .then(() => {
        return Tags.findOne({
            name: tag,
        })
    })
    .then(tagInfo => {
        if(!tagInfo){
            // The tag registry didn't have this tag
            return new Tags({
                name: tag,
                tracks: [
                    req.params.trackid
                ]
            })
            .save()
        }else{
            // The tag already exists
            if(!tagInfo.tracks.includes(req.params.trackid)){
                tagInfo.tracks.push(req.params.trackid);
                return Tags.update({
                    _id: tagInfo._id,
                }, tagInfo);
            }
        }
    })
    .then(() => {
        res.json({
            tag,
            message: 'Success',
            trackId: req.params.trackid,
        })
    })
    .catch(error => {
        console.log(error);
    })
});

router.delete('/tag/:trackid?', (req, res) => {
    const user = req.hsAuth.user;
    let tag = req.body.tag;
    const findTrack = new FindTrack(res, req);
    tag = escapeHtml(tag);
    tag = tag.replace(/ /g, '_');
    tag = tag.replace(/[^a-zA-Z0-9_]/g, '');
    // Find the track
    Tracks.findOne({
        id: req.params.trackid,
    })
    .then(track => {
        if(!track){
            res.status(403);
            res.json({
                error: 'Can not not that track id',
            });
            return false;
        }else{

            if(track.author !== user.id){
                res.status(401);
                res.json({
                    error: 'You are unauthorized to perform this action',
                });
                return false;
            }

            findTrack.removeTag(track, tag);
        }
    })
    .catch(error => {
        console.log(error);
    })
})

module.exports = router;