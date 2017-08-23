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
const filezizgag = require('../src/index').filezizgag;
const https = require('https');

router.post('/', (req, res) => {
    const token = req.body.token || req.headers.token || req.query.token;
    const full_address = req.protocol + "://" + req.headers.host;
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
            const form = formidable.IncomingForm({
                uploadDir: path.join(`${__dirname}/../tracks`),
            });
            form.encoding = 'utf-8';

            form.parse(req, (error, fields, files) => {
                if(typeof files.audio === 'undefined'){
                    res.json({
                        error: true,
                        msg: 'Missing audio field',
                        code: 'missing_require_fields',
                    });
                    return false;
                }
                const coverImage = files.image;

                if(coverImage){
                    if(!coverImage.type.includes('image')){
                        res.json({
                            error: true,
                            msg: 'The image fields is not an image file',
                            code: 'not_valid_file_object',
                        });
                        return false;
                    }
                }

                const description = fields.description || null;

                // Upload the audio first
                const tmp_audioFile = files.audio.path;
                const newAudioId = sha256(randomstring.generate(20));
                const file = files.audio;
                const ext = path.extname(file.name);
                return fsp.rename(tmp_audioFile, path.join(`${__dirname}/../tracks/${newAudioId}${ext}`))
                .then(() => {
                    // Save the track details to the database
                    // Remove the ext first
                    file.name = file.name.replace(ext, '');
                    // Trim down the file name
                    file.name = file.name.replace(/\W/igm, '');
                    file.name = file.name.replace(/ /igm, '-');
                    let title = fields.title || file.name;
                    // Check for the same title

                    return Tracks.findOne({
                        title,
                    })
                    .then(track => {

                        // Gen a new title, cuz someone else is using that title as well :/
                        if(track !== null){
                            title = `${title}(${randomstring.generate(10)})`;
                        }
                        const uploadDate = new Date();
                        return new Tracks({
                            title,
                            file: {
                                location: path.join(`${__dirname}/../tracks/${newAudioId}`),
                                extend: false,
                            },
                            author: {
                                username: user.username,
                                fullName: user.fullName,
                            },
                            uploadDate,
                            description,
                            private: true,
                        })
                        .save()
                        .then(track => {
                            // Save the track id into the user object
                            user.tracks.push(track._id);
                            this.track = track;
                            return Users.update({
                                _id: user._id,
                            }, user)
                            .then(() => {
                                res.json({
                                    _id: track._id,
                                    title,
                                    uploadDate,
                                    description,
                                    coverImage: track.coverImage,
                                    author: track.author,
                                });

                                // Upload the audio to Google Cloud Storage
                                gcs.bucket('hs-track')
                                .upload(path.join(`${__dirname}/../tracks/${newAudioId}${ext}`))
                                .then(file => {
                                    fs.unlinkSync(path.join(`${__dirname}/../tracks/${newAudioId}${ext}`));
                                    file = file[0];
                                    function removeGcsTrack(){
                                        file.delete();
                                    }
                                    // Get the download url
                                    return file.makePublic()
                                    .then(() => {
                                        if(files.audio.type.includes('ogg')){
                                            return rp({
                                                url: `${full_address}/api/notification`,
                                                headers: {
                                                    token,
                                                },
                                                method: 'post',
                                                json: true,
                                                body: {
                                                    to: user._id,
                                                    title: 'Processing your track',
                                                    body: `We are currently converting your track ${title} to MP3 formet`,
                                                }
                                            })
                                            .then(() => {
                                                return rp({
                                                    url: 'http://api.filezigzag.com/fzz.svc/convertfile',
                                                    method: 'POST',
                                                    json: true,
                                                    headers: {
                                                        token: filezizgag.key,
                                                    },
                                                    body: {
                                                        target: 'mp3',
                                                        category: 'audio',
                                                        source: `https://storage.googleapis.com/hs-track/${newAudioId}${ext}`,
                                                    }
                                                })
                                                .then(response => {
                                                    const jobId = response.Convertfile.id;
                                                    const waitingStatusCode = setInterval(function() {
                                                        console.log('fetching status code');
                                                        return rp({
                                                            url: 'http://api.filezigzag.com/fzz.svc/Getfile',
                                                            method: 'POST',
                                                            json: true,
                                                            headers: {
                                                                token: filezizgag.key,
                                                            },
                                                            body: {
                                                                id: jobId,
                                                            }
                                                        })
                                                        .then(response => {
                                                            if(response.Getfile.Status == 7){
                                                                uploadOggFile(response.Getfile.FileURL);
                                                            }
                                                        })
                                                    }, 30000);

                                                    function uploadOggFile(downloadUrl){
                                                        clearInterval(waitingStatusCode);
                                                        // Remove the MP3 from GCS
                                                        removeGcsTrack();
                                                        const download = require('download-file');
                                                        download(downloadUrl, {
                                                            directory: '../tracks',
                                                            filename: `${newAudioId}-converted.mp3`
                                                        }, error => {
                                                            if(error){
                                                                console.log(error);
                                                            }else{
                                                                // Re-upload the OGG to GCS

                                                                gcs.bucket('hs-track')
                                                                .upload(newPath)
                                                                .then(file => {
                                                                    file = file[0];
                                                                    return file.makePublic()
                                                                })
                                                                .then(() => {
                                                                    track.file.location = `https://storage.googleapis.com/hs-track/${newAudioId}-converted.mp3`;
                                                                    track.file.extend = true;
                                                                    track.private = false;
                                                                    return Tracks.update({
                                                                        _id: track._id,
                                                                    }, track)
                                                                })
                                                                .then(() => {
                                                                    fsp.unlinkSync(newPath);
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
                                                                            link: `${full_address}/track/${user.username}/${title}`,
                                                                        }
                                                                    })
                                                                })
                                                                .catch(error => {
                                                                    console.log(error);
                                                                })
                                                            }
                                                        })
                                                    }

                                                })
                                            })
                                        }else{
                                            track.file.location = `https://storage.googleapis.com/hs-track/${newAudioId}${ext}`;
                                            track.file.extend = true;
                                            track.private = false;
                                            Tracks.update({
                                                _id: track._id,
                                            }, track)
                                            .then(() => {
                                                // Remove the local track from the disk
                                                fs.unlinkSync(path.join(`${__dirname}/../tracks/${newAudioId}${ext}`));
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
                                                        link: `${full_address}/track/${user.username}/${title}`,
                                                    }
                                                })
                                                
                                            })

                                        }
                                    })
                                })
                                .catch(error => {
                                    console.log(error);
                                });

                                // Upload the cover image if they have any of those
                                if(coverImage){
                                    const gcsCoverImage = gcs.bucket('hs-cover-image');
                                    const newImageId = sha256(randomstring.generate(20));
                                    const extImage = path.extname(coverImage.name);
                                    fsp.rename(coverImage.path, path.join(`${__dirname}/../usersContent/${newImageId}${extImage}`))
                                    .then(() => {
                                        // Resize the image first
                                        return easyimage.resize({
                                            src: path.join(`${__dirname}/../usersContent/${newImageId}${extImage}`),
                                            dst: path.join(`${__dirname}/../usersContent/${newImageId}${extImage}`),
                                            width: 500,
                                            height: 500,
                                            ignoreAspectRatio: true,
                                        })
                                        .then(processedImage => {
                                            // Upload the image to Google Cloud Storage
                                            return gcsCoverImage.upload(processedImage.path)
                                            .then(file => {
                                                file = file[0];
                                                return file.makePublic()
                                                .then(() => {
                                                    // Update the track's cover image
                                                    track.coverImage = `https://storage.googleapis.com/hs-cover-image/${newImageId}${extImage}`;
                                                    return Tracks.update({
                                                        _id: track._id,
                                                    }, track);
                                                })
                                            })
                                        });
                                    })
                                    .catch(error => {
                                        console.log(error);
                                    })
                                }

                            });
                        });

                    });
                })
                .catch(error => {
                    console.log(error);
                })
            });
        }
    });
});

module.exports = router;