const express = require('express');
const router = express.Router();
const Users = require('../../schema/Users');
const formidable = require('formidable');
const randomstring = require('randomstring');
const sha256 = require('sha256');
const path = require('path');
const Tracks = require('../../schema/Tracks');
const fs = require('fs');
const fsp = require('fs-promise');
const rp = require('request-promise');
const gcs = require('@google-cloud/storage')({
    projectId: 'hoovessound',
    keyFilename: require('../../src/index').gcsPath,
});
const easyimage = require('easyimage');
const filezizgag = require('../../src/index').filezizgag;
const genId = require('../../src/helper/genId');
const escape = require('escape-html');
const fileType = require('file-type');

router.post('/', (req, res) => {

    // Check permission

    if(!req.query.bypass){
        if(!req.hsAuth.app.permission.includes('upload_track')){
            res.json({
                error: 'Bad permission scoping',
                code: 'service_lock_down',
            });
            return false;
        }
    }

    const full_address = req.protocol + "://" + req.headers.host;

    const form = formidable.IncomingForm({
        uploadDir: path.join(`${__dirname}/../../tracks`),
    });
    form.encoding = 'utf-8';

    form.parse(req, (error, fields, files) => {
        if(user === null){
            res.json({
                error: true,
                msg: 'Can not find your userid',
                code: 'unexpected_result',
            });
            return false;
        }else{
            if(typeof files.audio === 'undefined'){
                res.json({
                    error: true,
                    msg: 'Missing the audio file',
                    code: 'missing_require_fields',
                });
                return false;
            }
            const coverImage = files.image;

            if(coverImage){
                if(!fileType(fs.readFileSync(coverImage.path)).mime.includes('image')){
                    res.json({
                        error: 'The image fields is not an image file',
                        code: 'not_valid_file_object',
                    });
                    return false;
                }
            }

            // Check the audio file type
            const audioType = fileType(fs.readFileSync(files.audio.path)).mime;
            let findAudioType = false;
            const suportTypes = [
                'audio/mp3',
                'audio/mpeg',
                'audio/ogg'
            ];
            suportTypes.forEach(type => {
                if(type === audioType){
                    findAudioType = true;
                }
            });
            if(!findAudioType){
                res.json({
                    error: 'HoovesSound only suport MP3 or OGG audio file',
                    code: 'not_valid_file_object',
                });
                return false;
            }

            const description = fields.description ? escape(fields.description) : null;

            // Upload the audio first
            const tmp_audioFile = files.audio.path;
            const newAudioId = sha256(randomstring.generate(20));
            const file = files.audio;
            const ext = path.extname(file.name);
            return fsp.rename(tmp_audioFile, path.join(`${__dirname}/../../tracks/${newAudioId}${ext}`))
            .then(() => {
                let title = escape(fields.title) || file.name;
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
                        id: genId(),
                        title,
                        file: {
                            location: path.join(`${__dirname}/../../tracks/${newAudioId}`),
                            extend: false,
                        },
                        author: user.id,
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
                                id: track.id,
                                title,
                                uploadDate,
                                description,
                                coverImage: track.coverImage,
                                author: track.author,
                            });

                            // Upload the audio to Google Cloud Storage
                            gcs.bucket('hs-track')
                            .upload(path.join(`${__dirname}/../../tracks/${newAudioId}${ext}`))
                            .then(file => {
                                fs.unlinkSync(path.join(`${__dirname}/../../tracks/${newAudioId}${ext}`));
                                file = file[0];
                                function removeGcsTrack(){
                                    file.delete();
                                }
                                // Get the download url
                                return file.makePublic()
                                .then(() => {
                                    track.file.location = `https://storage.googleapis.com/hs-track/${newAudioId}${ext}`;
                                    track.file.extend = true;
                                    track.private = false;
                                    return Tracks.update({
                                        _id: track._id,
                                    }, track)
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
                                fsp.rename(coverImage.path, path.join(`${__dirname}/../../usersContent/${newImageId}${extImage}`))
                                .then(() => {
                                    // Resize the image first
                                    return easyimage.resize({
                                        src: path.join(`${__dirname}/../../usersContent/${newImageId}${extImage}`),
                                        dst: path.join(`${__dirname}/../../usersContent/${newImageId}${extImage}`),
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
        }
    });
});

module.exports = router;