const express = require('express');
const router = express.Router();
const Users = require('../schema/Users');
const formidable = require('formidable');
const randomstring = require('randomstring');
const sha256 = require('sha256');
const path = require('path');
const Tracks = require('../schema/Tracks');
const fs = require('fs');
const request = require('request');
const fullurl = require('fullurl');
const fsp = require('fs-promise');
const rp = require('request-promise');
const gcs = require('@google-cloud/storage')({
    projectId: 'hoovessound',
    keyFilename: require('../src/index').gcsPath,
});
const easyimage = require('easyimage');

router.post('/', (req, res) => {
    const token = req.body.token || req.headers.token || req.query.token;
    const full_address = req.protocol + "://" + req.headers.host;
    Users.findOne({
        token: token,
    }).then(user => {
        if(user === null){
            res.json({
                error: true,
                msg: 'Can not find your token',
                code: 'token_not_found',
            });
            return false;
        }else{
            const form = formidable.IncomingForm({
                uploadDir: path.join(`${__dirname}/../tracks`),
            });
            form.encoding = 'utf-8';
            form.parse(req, (error, fields, files) => {
                if(error){
                    console.log(error);
                }else{
                    // Check if the request contain the 'audio' fields
                    if(typeof files.audio === 'undefined') {
                        res.json({
                            error: true,
                            msg: 'Missing the audio field',
                            code: 'missing_require_fields',
                        });
                        return false;
                    }

                    // Check if the audio fields is an file
                    if(typeof files.audio !== 'object'){
                        res.json({
                            error: true,
                            msg: 'Audio fields is not an file',
                            code: 'not_valid_file_object',
                        });
                        return false;
                    }
                    file = files.audio;
                    let coverImage = files.image;
                    const description = fields.description || null;
                    // Check if there a cover image
                    if(typeof coverImage !== 'undefined'){
                        // There is a cover image
                        if(!coverImage.type.includes('image')){
                            res.json({
                                error: true,
                                msg: 'Please upload an image file',
                                code: 'not_valid_file_type',
                            });
                            return false;
                        }

                        // Is a valid image file

                        // Read to upload to GCS
                        const ext = path.extname(coverImage.name);
                        const newID = sha256(randomstring.generate(10));
                        let fileID = newID + ext;
                        const coverImagePath = path.join(`${__dirname}/../usersContent/${fileID}`);
                        const gcsCoverImage = gcs.bucket('hs-cover-image');
                        fsp.rename(coverImage.path, coverImagePath)
                        .then(() => {
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
                                        uploadAudio();
                                    })
                                })
                            });
                        })
                        .catch(error => {
                            console.log(error);
                        })

                    }else{
                        uploadAudio();
                    }

                    function uploadAudio() {
                        // MIME type checking
                        if(!file.type.includes('audio')){
                            res.json({
                                error: true,
                                msg: 'Please upload an audio file',
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
                        let title = fields.title || file.name;
                        // Check for the same title
                        Tracks.findOne({
                            title,
                        })
                        .then(track => {
                            // Gen a new title, cuz someone else is using that title as well :/
                            if(track !== null){
                                title = `${title}(${randomstring.generate(10)})`;
                            }
                            const newID = sha256(randomstring.generate(10));
                            let fileID = newID + ext;
                            const filePath = path.join(`${__dirname}/../tracks/${fileID}`);
                            // Write the file into the disk
                            fs.rename(file.path, filePath, error => {
                                if(error){
                                    console.log(error);
                                }else{
                                    // Save the track info into the track collection

                                    // Redirect the user: Using the local tracks first
                                    const newTracks = new Tracks({
                                        title: title,
                                        file: {
                                            location: fileID,
                                            extend: false,
                                        },
                                        author: {
                                            username: user.username,
                                            fullName: user.fullName,
                                        },
                                        uploadDate: new Date(),
                                        coverImage,
                                        description,
                                    }).save().then(track => {
                                        // Save the track id into the user object
                                        user.tracks.push(track._id);
                                        this.track = track;
                                        return Users.update({
                                            _id: user._id,
                                        }, user).then(() => {
                                            let newResponse = JSON.parse(JSON.stringify(this.track));
                                            delete newResponse.file;
                                            res.json({
                                                track: newResponse,
                                                url: full_address + `/track/${user.username}/${title}`,
                                            });
                                        });
                                    })
                                    .catch(error => {
                                        console.log(error)
                                    });

                                    // Upload the file to Google Cloud Storage
                                    const gcsTracks = gcs.bucket('hs-track');
                                    gcsTracks.upload(filePath)
                                        .then(file => {
                                            file = file[0];
                                            // Get the download url
                                            return file.getSignedUrl({
                                                action: 'read',
                                                expires: '03-09-2491',
                                            })
                                                .then(url => {
                                                    url = url[0];
                                                    this.track.file.location = url;
                                                    this.track.file.extend = true;
                                                    Tracks.update({
                                                        _id: this.track._id
                                                    }, this.track).then(() => {
                                                        // Remove the lcoal track from the disk
                                                        fs.unlinkSync(filePath);
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
                                                                title: 'Track Is Uploaded!',
                                                                body: `${title} Is Uploaded`,
                                                                link: `${full_address}/api/notification`,
                                                            }
                                                        })
                                                    })
                                                })
                                        })
                                        .catch(error => {
                                            console.log(error);
                                        });
                                }
                            });
                        });
                    }
                }
            });
        }
    });
});

module.exports = router;