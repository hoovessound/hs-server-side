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
const gcs = require('@google-cloud/storage')({
    projectId: 'hoovessound',
    keyFilename: require('../../src/index').gcsPath,
});
const easyimage = require('easyimage');
const filezizgag = require('../../src/index').filezizgag;
const genId = require('../../src/helper/genId');
const escape = require('escape-html');
const fileType = require('file-type');
const youtubeDl = require('../../src/helper/youtubeDlCLI');
const indexJs = require('../../src/index');

router.post('/', (req, res) => {
    // Check permission

    if(!req.query.bypass){
        if(!req.hsAuth.app.permission.includes('upload_track')){
            res.status(401);
            res.json({
                error: 'Bad permission scoping',
            });
            return false;
        }
    }

    const full_address = req.protocol + "://" + req.headers.host;
    const user = req.hsAuth.user;
    const form = formidable.IncomingForm({
        uploadDir: indexJs.tmp,
    });
    form.encoding = 'utf-8';

    form.parse(req, (error, fields, files) => {
        if(user === null){
            res.status(403);
            res.json({
                error: 'Can not find your userid',
            });
            return false;
        }else{

            if(fields['youtube-import'] !== 'on' || !fields['youtube-import']){

                // Raw upload
                if(typeof files.audio === 'undefined'){
                    res.status(403);
                    res.json({
                        error: 'Missing the audio file',
                    });
                    return false;
                }
                const coverImage = files.image;
                const rawCoverImage = fs.readFileSync(coverImage.path);
                if(coverImage && fileType(rawCoverImage) !== null){
                    if(!fileType(fs.readFileSync(coverImage.path)).mime.includes('image')){
                        res.status(403);
                        res.json({
                            error: 'The image fields is not an image file',
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
                    res.status(403);
                    res.json({
                        error: 'HoovesSound only suport MP3 or OGG audio file',
                    });
                    return false;
                }

                const description = fields.description ? escape(fields.description) : null;

                // Upload the audio first
                const tmp_audioFile = files.audio.path;
                const newAudioId = sha256(randomstring.generate(20) + Date.now());
                const file = files.audio;
                const ext = path.extname(file.name);
                return fsp.rename(tmp_audioFile, path.join(`${indexJs.tmp}/${newAudioId}${ext}`))
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
                                location: path.join(`${indexJs.tmp}/${newAudioId}${ext}`),
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
                                res.status(201);
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
                                .upload(path.join(`${indexJs.tmp}/${newAudioId}${ext}`))
                                .then(file => {
                                    fs.unlinkSync(path.join(`${indexJs.tmp}/${newAudioId}${ext}`));
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
                                if(coverImage && coverImage.size > 1){
                                    const gcsCoverImage = gcs.bucket('hs-cover-image');
                                    const newImageId = sha256(randomstring.generate(20) + Date.now());
                                    const extImage = path.extname(coverImage.name);
                                    fsp.rename(coverImage.path, path.join(`${indexJs.tmp}/${newImageId}${extImage}`))
                                    .then(() => {
                                        return gcsCoverImage.upload(path.join(`${indexJs.tmp}/${newImageId}${extImage}`))
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
                                    })
                                    .catch(error => {
                                        console.log(error);
                                    })
                                }

                            });
                        });

                    });
                });
            }else{
                // YouTube import
                const ytid = fields['youtube-id'];
                if(!ytid){
                    res.status(403);
                    res.json({
                        error: 'youtube-id field is missing',
                    });
                    return false;
                }

                // Fetch the YouTube data
                const dl = new youtubeDl.youtubeDlCLI(ytid);
                async function fetchData(){
                    let title = await dl.getTitle();
                    let description = await dl.getDescription();
                    const coverImage = await dl.getCoverArt();
                    const uploadDate = new Date();
                    const id = genId();

                    return new Tracks({
                        id,
                        title,
                        file: {
                            location: ytid,
                            extend: true,
                        },
                        author: user.id,
                        uploadDate,
                        description,
                        private: false,
                        source: 'youtube',
                        coverImage,
                    })
                    .save()
                    .then(() => {
                        res.status(201);
                        res.json({
                            id,
                            title,
                            uploadDate,
                            description,
                            coverImage,
                            author: req.hsAuth.user.id,
                            source: 'youtube',
                        });
                    })
                    .catch(error => {
                        console.log(error)
                    })
                }
                fetchData();
            }

        }
    });
});

module.exports = router;