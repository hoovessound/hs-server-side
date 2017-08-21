import express from 'express';
const router = express.Router();
import Users from '../schema/Users';
import Tracks from '../schema/Tracks';
import formidable from 'formidable';
import randomstring from 'randomstring';
import sha256 from 'sha256';
const fs =require('fs');
import path from 'path';
const gcs = require('@google-cloud/storage')({
    projectId: 'hoovessound',
    keyFilename: require('../src/index').gcsPath,
});
import fullurl from 'fullurl';
import fp from 'fs-promise';
import easyimage from 'easyimage';

// save the normal settings
router.post('/', (req, res) => {
    const token = req.body.token || req.headers.token || req.query.token;
    
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

            // Check for MINE types
            if(req.headers['content-type'] !== 'application/json'){
                res.json({
                    error: true,
                    msg: 'Please using application/json as your HTTP Content-Type',
                    code: 'invalid_http_request',
                });
                return false;
            }

            // Check for the settings object
            if(!req.body.settings){
                res.json({
                    error: true,
                    msg: 'Missign the settings object',
                    code: 'not_valid_object',
                });
                return false;
            }

            // Check for the settings.full_name
            if(!req.body.settings.full_name){
                res.json({
                    error: true,
                    msg: 'Missign the settings.full_name string',
                    code: 'not_valid_string',
                });
                return false;
            }
            
            // Update the DB
            user.fullName = req.body.settings.full_name;
            return Users.update({
                _id: user._id,
            }, user)
            .then(() => {
                // Return a new user object
                return Users.findOne({
                    _id: user._id
                }, {
                    password: 0,
                    tracks: 0,
                    token: 0,
                })
                .then(user => {
                    this.user = user;
                    res.json(user);
                    // Update the tracks DB as well
                    return Tracks.find({
                        'author.username': user.username,
                    })
                    .then(tracks => {
                        tracks.forEach(track => {
                            track.author.fullName = this.user.fullName;
                            return Tracks.update({
                                _id: track._id,
                            }, track)
                            .catch(error => {
                                console.log(error);
                            });
                        });
                    });
                });
            })
        }
    })
    .catch(error => {
        console.log(error);
    })
});

// Upload the profile picture
router.post('/profilepicture/upload', (req, res) => {
    const full_address = req.protocol + "://" + req.headers.host;
    const token = req.body.token || req.headers.token || req.query.token;
    
    if(typeof token === 'undefined'){
        res.json({
            error: true,
            msg: 'Please login first',
            code: 'auth_require'
        });
        return false;
    }else{
        Users.findOne({
            token: token,
        })
        .then(user => {
            this.user = user;
            if(user === null){
                res.json({
                    error: true,
                    msg: 'Can not find your token',
                    code: 'token_not_found',
                });
                return false;
            }else{
                 const form = formidable.IncomingForm({
                    uploadDir: path.join(`${__dirname}/../usersContent`),
                });
                form.encoding = 'utf-8';
                form.parse(req, (error, fields, files) => {
                    // Check if the request contain the 'image' fields
                    if(typeof files.image === 'undefined') {
                        res.json({
                            error: true,
                            msg: 'Missing the image field',
                            code: 'missing_require_fields',
                        });
                        return false;
                    }

                    file = files.image;
                    // MIME type checking
                    if(!file.type.includes('image')){
                        res.json({
                            error: true,
                            msg: 'Please upload a image file',
                            code: 'not_valid_file_type',
                        });
                        return false;
                    }

                    // Check if the file is an GIF file
                    if(file.type.includes('gif')){
                        res.json({
                            error: true,
                            msg: 'GIF image is not supported',
                            code: 'not_valid_file_type',
                        });
                        return false;
                    }

                    const ext = path.extname(file.name);
                    // Remvoe the ext first
                    file.name = file.name.replace(ext, '');
                    // Traim down the file name
                    file.name = file.name.replace(/\W/igm, '');
                    file.name = file.name.replace(/ /igm, '-');
                    const title = fields.title || file.name;
                    const newID = sha256(randomstring.generate(10));
                    let fileID = newID + ext;
                    const filePath = path.join(`${__dirname}/../usersContent/${fileID}`);
                    fs.rename(file.path, filePath, error => {
                        
                        if(error){
                            console.log(error);
                        }else{

                            res.json({
                                success: true,
                                msg: 'Processing the image'
                            });

                            // Resize the image to 50x50 Q: 50

                            return easyimage.resize({
                                src: filePath,
                                dst: filePath,
                                width: 50,
                                height: 50,
                                ignoreAspectRatio: true,
                            }).then(processedImage => {
                                return fp.exists(filePath).then(exists => {
                                    if(exists){
                                        // Upload the file to Google Cloud Storage
                                        const gcsProfilePictures = gcs.bucket('hs-profile-picture');
                                        return gcsProfilePictures.upload(filePath).then(file => {
                                            file = file[0];
                                            return file.getSignedUrl({
                                                action: 'read',
                                                expires: '03-09-2491',
                                            }).then(url => {
                                                // Update the new image URL to the DB
                                                this.user.icon = url[0];
                                                return Users.update({
                                                    _id: this.user._id,
                                                }, this.user).then(() => {
                                                    // Remove the icon from local disk
                                                    fp.unlinkSync(filePath);
                                                });
                                            })
                                        });
                                    }
                                });
                            })
                        }
                    });
                });
            }
        })
        .catch(error => {
            console.log(error);
        })

    }
});


module.exports = router;