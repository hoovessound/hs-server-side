const express = require('express');
const router = express.Router();
const Users = require('../schema/Users');
const Tracks = require('../schema/Tracks');
const formidable = require('formidable');
const randomstring = require('randomstring');
const sha256 = require('sha256');
const fs =require('fs');
const path = require('path');
const gcs = require('@google-cloud/storage')({
    projectId: 'hoovessound',
    keyFilename: require('../src/index').gcsPath,
});
const fp = require('fs-promise');
const easyimage = require('easyimage');
const escape = require('escape-html');

// save the normal settings
router.post('/', (req, res) => {
    if(req.query.bypass !== 'true'){
        res.json({
            error: true,
            msg: 'Internal API',
            code: 'services_lock_down',
        })
        return false;
    }
    const user = req.hsAuth.user;
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
    user.fullName = escape(req.body.settings.full_name);
    return Users.update({
        _id: user._id,
    }, user)
    .then(() => {
        res.json({
            fullname: user.fullName,
            username: user.username,
            icon: user.icon,
            id: user.id,
        });
    })
    .catch(error => {
        console.log(error);
    })
});

// Upload the profile picture
router.post('/profilepicture', (req, res) => {
    const full_address = req.protocol + "://" + req.headers.host;
    const user = req.hsAuth.user;
    this.user = req.hsAuth.user;
    if(req.query.bypass !== 'true'){
        res.json({
            error: true,
            msg: 'Internal API',
            code: 'services_lock_down',
        })
        return false;
    }

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
        // Remove the ext first
        file.name = file.name.replace(ext, '');
        // Trim down the file name
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
                // Resize the image to 50x50 Q: 50

                return easyimage.resize({
                    src: filePath,
                    dst: filePath,
                    width: 50,
                    height: 50,
                    ignoreAspectRatio: true,
                })
                .then(processedImage => {
                    return fp.exists(filePath)
                })
                .then(exists => {
                    if(exists){
                        // Upload the file to Google Cloud Storage
                        const gcsProfilePictures = gcs.bucket('hs-profile-picture');
                        return gcsProfilePictures.upload(filePath).then(file => {
                            file = file[0];
                            return file.makePublic()
                            .then(url => {
                                // Update the new image URL to the DB
                                this.user.icon = `https://storage.googleapis.com/hs-profile-picture/${fileID}`;
                                return Users.update({
                                    _id: this.user._id,
                                }, this.user).then(() => {
                                    // Remove the icon from local disk
                                    fp.unlinkSync(filePath);
                                    res.json({
                                        icon: this.user.icon,
                                    });
                                });
                            })
                        });
                    }else{
                        res.json({
                            error: 'Something when wrong, please try again later',
                            code: 'system_error',
                        })
                    }
                })
                .catch(error => {
                    console.log(error);
                })
            }
        });
    });
});


module.exports = router;